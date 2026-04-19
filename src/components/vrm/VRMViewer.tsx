/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Mood } from '../../types';
import { applyNaturalStandPose } from '../../services/poses/naturalStand';
import { updateBlink } from '../../services/expressions/blink';
import { updateChatter } from '../../services/expressions/chatter';
import { updateMoodExpression } from '../../services/expressions/mood';

interface VRMViewerProps {
  mood: Mood;
  vrmUrl?: string;
  action?: 'idle' | 'feed' | 'clean' | 'play' | 'pet' | 'sleep';
  isSpeaking?: boolean;
  onActionComplete?: () => void;
}

export const VRMViewer: React.FC<VRMViewerProps> = ({ 
  mood, 
  vrmUrl = 'https://models.columbina.kr/models/c1.vrm',
  action = 'idle',
  isSpeaking = false,
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

  // Sync state to internal refs to avoid stale closures in animation loop
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

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
        applyNaturalStandPose(vrm, 0, 0);

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

          // Calculate current petting intensity
          // Action is pet (Petting button pressed)
          const isPetting = currentActionRef.current === 'pet';
          const isSleeping = currentActionRef.current === 'sleep';
          const isPlaying = currentActionRef.current === 'play';

          if (isPetting) {
            pettingIntensity = Math.min(1.0, pettingIntensity + delta * 5);
          } else {
            pettingIntensity = Math.max(0.0, pettingIntensity - delta * 3);
          }

          // Apply Natural Stand Pose (Breathing, Spine, Arms, Legs)
          // Add extra head tilt if playing
          const playMotion = isPlaying ? Math.sin(time * 8) * 0.1 : 0;
          applyNaturalStandPose(vrm, time, pettingIntensity);
          if (isPlaying && vrm.humanoid) {
            const head = vrm.humanoid.getNormalizedBoneNode('head');
            if (head) head.rotation.z += playMotion;
          }

          if (currentActionRef.current !== 'idle' && currentActionRef.current !== 'pet' && currentActionRef.current !== 'sleep' && currentActionRef.current !== 'play') {
            // Fallback for other actions
            currentActionRef.current = 'idle';
            if (onActionComplete) onActionComplete();
          }

          // Actions completion logic
          if (['pet', 'sleep', 'play'].includes(currentActionRef.current)) {
            actionProgressRef.current += delta;
            // Sleep stays longer
            const duration = currentActionRef.current === 'sleep' ? 3.0 : 2.0;
            if (actionProgressRef.current >= duration) {
              currentActionRef.current = 'idle';
              if (onActionComplete) onActionComplete();
            }
          }
          
          // Expression Management (Mood)
          updateMoodExpression(vrm, moodRef.current);
          
          // Expression Management (Blink)
          // Forced eyes closed if sleeping
          const shouldForcedClose = isSleeping;
          const isSmilingMood = moodRef.current === 'happy' || moodRef.current === 'excited';
          const maxBlink = moodRef.current === 'angry' ? 0.5 : 1.0;
          
          if (shouldForcedClose) {
            vrm.expressionManager?.setValue('blink', 1.0);
          } else {
            updateBlink(vrm, time, !isSmilingMood, maxBlink);
          }

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
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      // Cleanup loaded objects if necessary
    };
  }, [vrmUrl]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-10 transition-opacity">
          <div className="text-white font-medium animate-pulse">Loading Character...</div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
