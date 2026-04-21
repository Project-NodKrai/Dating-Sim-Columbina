/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Mood } from '../../types';
import { applyNaturalStandPose } from '../../services/poses/naturalStand';
import { applyPettingPose } from '../../services/poses/pettingPose';
import { applyPlayPose } from '../../services/poses/playPose';
import { applySurprisedPose } from '../../services/poses/surprisedPose';
import { applyShyPose } from '../../services/poses/shyPose';
import { applySleepPose } from '../../services/poses/sleepPose';
import { updateBlink } from '../../services/expressions/blink';
import { updateChatter } from '../../services/expressions/chatter';
import { updateMoodExpression } from '../../services/expressions/mood';

interface VRMViewerProps {
  mood: Mood;
  vrmUrl?: string;
  action?: 'idle' | 'feed' | 'clean' | 'play' | 'pet' | 'sleep';
  isSpeaking?: boolean;
  petSpeed?: number;
  isInteractivePetting?: boolean;
  onActionComplete?: () => void;
}

export const VRMViewer: React.FC<VRMViewerProps> = ({ 
  mood, 
  vrmUrl = 'https://models.columbina.kr/models/c1.vrm',
  action = 'idle',
  isSpeaking = false,
  petSpeed = 1.0,
  isInteractivePetting = false,
  onActionComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vrmRef = useRef<VRM | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [loading, setLoading] = useState(true);

  // Animation States
  const currentActionRef = useRef<'idle' | 'feed' | 'clean' | 'play' | 'pet' | 'sleep'>('idle');
  const actionProgressRef = useRef<number>(0);
  const moodRef = useRef<Mood>(mood);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const petSpeedRef = useRef<number>(petSpeed);
  const isInteractivePettingRef = useRef<boolean>(isInteractivePetting);

  // Sync state to internal refs to avoid stale closures in animation loop
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    petSpeedRef.current = petSpeed;
  }, [petSpeed]);

  useEffect(() => {
    isInteractivePettingRef.current = isInteractivePetting;
  }, [isInteractivePetting]);

  // Sync action prop to internal ref
  useEffect(() => {
    if (action !== 'idle') {
      currentActionRef.current = action;
      actionProgressRef.current = 0;
    }
  }, [action]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 1.4, 2.5);
    camera.lookAt(0, 1.4, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    
    // Enhanced Brightness and Flat Anime look
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping; 
    renderer.toneMappingExposure = 1.0;

    // --- Lighting ---
    // High intensity AmbientLight for flat, shadowless look
    const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
    scene.add(ambientLight);
    
    // Frontal DirectionalLight to clear out any remaining shadows
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(0, 1.4, 2); // Directly in front at head height
    scene.add(light);
    
    // Fill light from camera direction
    const fillLight = new THREE.PointLight(0xffffff, 1.0);
    fillLight.position.set(0, 1.4, 2);
    scene.add(fillLight);

    // --- OrbitControls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 5;
    controls.target.set(0, 1.2, 0);

    // --- VRM Loading ---
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          console.error('VRM not found in GLTF data');
          return;
        }

        // Fix orientation - try removing manual rotation if it's backwards
        // Some models need 0, some need Math.PI. 
        // We'll reset it to 0 first as a common fix for modern VRMs facing towards camera by default
        vrm.scene.rotation.y = 0; 
        
        // Setup Animation Mixer
        mixerRef.current = new THREE.AnimationMixer(vrm.scene);

        // --- Initial Pose Adjustment ---
        applyNaturalStandPose(vrm, 0);

        // Ensure lookAt target is set
        if (vrm.lookAt) {
          vrm.lookAt.target = camera;
        }

        // Optimize materials for extreme brightness, but keep face parts more natural
        vrm.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            
            // Heuristic to find face/head related parts
            const name = mesh.name.toLowerCase();
            const isFacePart = name.includes('face') || 
                              name.includes('skin') || 
                              name.includes('eye') || 
                              name.includes('mouth') ||
                              name.includes('head');

            if (mesh.material && 'emissiveIntensity' in mesh.material) {
              // Lower intensity for face parts, keep high for clothes/body
              (mesh.material as any).emissiveIntensity = isFacePart ? 0.3 : 1.0;
            }
          }
        });

        scene.add(vrm.scene);
        vrmRef.current = vrm;
        setLoading(false);
      },
      (progress) => {
        console.log('Loading VRM...', Math.round((progress.loaded / progress.total) * 100), '%');
      },
      (error) => console.error('Error loading VRM:', error)
    );

    // --- Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const { clientWidth, clientHeight } = containerRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let animationId: number;
    let pettingIntensity = 0;
    let playIntensity = 0;
    let surprisedIntensity = 0;
    let shyIntensity = 0;
    let sleepIntensity = 0;
    let pettingPhase = 0; // State to track smooth phase accumulation

    // Raycaster for checking if petting touches character
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-2, -2); // init offscreen

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      pointer.x = (clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!renderer || !scene || !camera) return;

      const delta = clock.getDelta();
      
      // Update Controls
      controls.update();

      // Update VRM and Mixer
      if (vrmRef.current) {
        const vrm = vrmRef.current;
        const time = clock.elapsedTime;
        
        try {
          // Reset expressions that might be controlled by multiple systems
          if (vrm.expressionManager) {
            vrm.expressionManager.setValue('aa', 0);
          }

          // Update Animation Mixer
          if (mixerRef.current) {
            mixerRef.current.update(delta);
          }

          // Raycast to check if hovering character
          let isHoveringCharacter = false;
          if (isInteractivePettingRef.current) {
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(vrm.scene, true);
            isHoveringCharacter = intersects.length > 0;
          }

          // Calculate current intensities
          // 직접 쓰다듬기 모드일 때는 마우스가 캐릭터 위에 있고, AND 속도가 0보다 커야 (실제로 움직이고 있어야) 모션이 재생됩니다.
          const isActuallyMoving = petSpeedRef.current > 0.1;
          const isPetting = currentActionRef.current === 'pet' && 
                           (!isInteractivePettingRef.current || (isHoveringCharacter && isActuallyMoving));
          const isSleeping = currentActionRef.current === 'sleep';
          const isPlaying = currentActionRef.current === 'play';
          const isSurprised = moodRef.current === 'surprised';
          const isShy = moodRef.current === 'shy';

          if (isPetting) {
            pettingIntensity = Math.min(1.0, pettingIntensity + delta * 5);
            // Accumulate phase smoothly based on petSpeed (mapped gently)
            const speedFactor = 1.0 + (Math.min(Math.max(petSpeedRef.current, 0.5), 3.0) - 1.0) * 0.4; // 1.0 to 1.8 multiplier max
            pettingPhase += delta * speedFactor;
          } else {
            pettingIntensity = Math.max(0.0, pettingIntensity - delta * 3);
            // Continue advancing phase at base speed to smoothly return to rest if intensity > 0
            if (pettingIntensity > 0) {
              pettingPhase += delta;
            }
          }
          
          if (isPlaying) {
            playIntensity = Math.min(1.0, playIntensity + delta * 5);
          } else {
            playIntensity = Math.max(0.0, playIntensity - delta * 3);
          }

          if (isSurprised) {
            surprisedIntensity = Math.min(1.0, surprisedIntensity + delta * 8); // 놀람은 매우 빠르게
          } else {
            surprisedIntensity = Math.max(0.0, surprisedIntensity - delta * 2);
          }

          if (isShy) {
            shyIntensity = Math.min(1.0, shyIntensity + delta * 3);
          } else {
            shyIntensity = Math.max(0.0, shyIntensity - delta * 2);
          }

          if (isSleeping) {
            sleepIntensity = Math.min(1.0, sleepIntensity + delta * 2); // 눕듯이 서서히
          } else {
            sleepIntensity = Math.max(0.0, sleepIntensity - delta * 3);
          }

          // Step 1: Base idle posture
          applyNaturalStandPose(vrm, time);

          // Step 2: Layer independent action poses
          applyPettingPose(vrm, pettingPhase, pettingIntensity);
          applyPlayPose(vrm, time, playIntensity);
          applySurprisedPose(vrm, time, surprisedIntensity);
          applyShyPose(vrm, time, shyIntensity);
          applySleepPose(vrm, time, sleepIntensity);

          if (currentActionRef.current !== 'idle' && !['pet', 'sleep', 'play'].includes(currentActionRef.current)) {
            // Fallback for other actions
            currentActionRef.current = 'idle';
            if (onActionComplete) onActionComplete();
          }

          // Actions completion logic
          if (['pet', 'sleep', 'play'].includes(currentActionRef.current)) {
            if (currentActionRef.current === 'pet' && isInteractivePettingRef.current) {
              // 직접 쓰다듬기 도중에는 2초가 지나도 포즈가 끝나지 않고 계속 유지되도록 막음
              actionProgressRef.current = 0; // 진행도를 계속 0으로 고정하여 종료 방지
            } else {
              actionProgressRef.current += delta;
              // Sleep stays longer
              const duration = currentActionRef.current === 'sleep' ? 3.0 : 2.0;
              if (actionProgressRef.current >= duration) {
                currentActionRef.current = 'idle';
                if (onActionComplete) onActionComplete();
              }
            }
          }
          
          // Expression Management (Mood)
          updateMoodExpression(vrm, moodRef.current);
          
          // Expression Management (Blink)
          // `blink.ts` 내부에서 isSleeping 강제 감기와 mood에 따른 maxBlink 감쇠를 모두 처리합니다.
          updateBlink(vrm, time, moodRef.current, isSleeping);

          // Expression Management (Chatter/LipSync)
          updateChatter(vrm, time, isSpeakingRef.current);

          vrm.update(delta);
        } catch (e) {
          if (time % 5 < 0.1) console.error("VRM loop error", e);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      // Cleanup loaded objects if necessary
    };
  }, [vrmUrl]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-vibrant-bg z-50 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fff9fb_0%,#ffd1dc_100%)] opacity-80" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-vibrant-pink/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-vibrant-pink border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-vibrant-pink font-bold text-lg tracking-widest animate-pulse">
                캐릭터를 불러오는 중...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
