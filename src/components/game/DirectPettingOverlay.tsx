import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DirectPettingOverlayProps {
  happiness: number;
  onReaction: (speed: 'fast' | 'slow') => void;
  onSpeedUpdate?: (speedMultiplier: number) => void;
  onCancel: () => void;
}

export const DirectPettingOverlay: React.FC<DirectPettingOverlayProps> = ({ happiness, onReaction, onSpeedUpdate, onCancel }) => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const lastMousePos = useRef({ x: -100, y: -100 });
  const lastTime = useRef(Date.now());
  const distanceAccumulated = useRef(0);
  const totalSpeed = useRef(0);
  const speedSamples = useRef(0);
  const emitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      setMousePos({ x: clientX, y: clientY });

      const now = Date.now();
      const dt = now - lastTime.current;
      
      if (lastMousePos.current.x !== -100 && dt > 0) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const speed = distance / dt; // pixels per ms
        
        if (distance > 0) {
            totalSpeed.current += speed;
            speedSamples.current += 1;
            distanceAccumulated.current += distance;
            
            // Emit speed update
            if (onSpeedUpdate) {
                // Determine multiplier, normal speed is ~0.5 pixels/ms. Max out at ~3.0
                const instantMultiplier = Math.min(Math.max(0.5, speed * 2), 3.0);
                onSpeedUpdate(instantMultiplier);
                
                // Clear and re-set timeout to revert speed to 0.0 when not moving
                if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
                emitTimeoutRef.current = setTimeout(() => {
                    onSpeedUpdate(0.0);
                }, 100);
            }
        }

        // Trigger reaction after certain amount of petting (base 1000 pixels distance)
        // Multiplier: 1.0x at 0 happiness, 2.0x at 100 happiness
        const durationMultiplier = 1.0 + (Math.max(0, Math.min(100, happiness)) / 100) * 1.0; 
        const targetDistance = 1000 * durationMultiplier;

        if (distanceAccumulated.current > targetDistance) {
            const avgSpeed = totalSpeed.current / speedSamples.current;
            // avgSpeed ~ 1 is fairly fast, > 1.5 is very fast
            const speedType = avgSpeed > 1.0 ? 'fast' : 'slow';
            onReaction(speedType);
            
            // Reset to prevent multiple triggers if unmounting is delayed
            distanceAccumulated.current = -9999; // prevent triggers
        }
      }

      lastMousePos.current = { x: clientX, y: clientY };
      lastTime.current = now;
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling on mobile when petting
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    // For touch start to initialize position correctly
    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            lastTime.current = Date.now();
            setMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Hide default cursor globally during petting
    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      document.body.style.cursor = '';
    };
  }, [onReaction]);

  return (
    <div 
      className="fixed inset-0 z-[2000] cursor-none"
      onClick={() => {
        // Only cancel if they didn't pet much (e.g. they just clicked to exit)
        if (distanceAccumulated.current < 50 && distanceAccumulated.current !== -9999) {
          onCancel();
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); onCancel(); }}
    >
      <div className="absolute top-4 left-0 w-full text-center text-white/50 text-sm pointer-events-none">
        클릭(가만히)하거나 우클릭하면 취소됩니다.
      </div>
      <img 
        src="/assets/icons/handicorn.webp" 
        alt="hand" 
        className="fixed pointer-events-none w-24 h-24 object-contain origin-top-left"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </div>
  );
};
