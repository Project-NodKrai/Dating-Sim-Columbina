/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialogue } from '../../types';
// removed Send import

interface DialogueBoxProps {
  dialogue?: Dialogue;
  isLoading?: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  className?: string;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, isLoading, onSpeakingChange, className }) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typewriter effect
  useEffect(() => {
    if (!dialogue?.text) return;
    
    setDisplayedText('');
    
    // Reset speaking state to false first then true to ensure state change triggers
    if (onSpeakingChange) onSpeakingChange(false);

    let i = 0;
    let isActive = true;
    
    // Small timeout to ensure the "false" state is registered before starting again
    const startTimeout = setTimeout(() => {
      if (!isActive) return;
      if (onSpeakingChange) onSpeakingChange(true);

      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }

        if (i < dialogue.text.length) {
          const char = dialogue.text.charAt(i);
          if (char) {
            setDisplayedText(prev => prev + char);
          }
          i++;
        }
        
        if (i >= dialogue.text.length) {
          clearInterval(interval);
          if (onSpeakingChange) onSpeakingChange(false);
        }
      }, 30);

      activeInterval = interval;
    }, 10);

    let activeInterval: NodeJS.Timeout | null = null;

    return () => {
      isActive = false;
      clearTimeout(startTimeout);
      if (activeInterval) clearInterval(activeInterval);
      if (onSpeakingChange) onSpeakingChange(false);
    };
  }, [dialogue?.text, dialogue?.timestamp, onSpeakingChange]);

  return (
    <div className={className || "absolute bottom-10 left-1/2 -translate-x-1/2 w-[min(95%,900px)] z-20"}>
      <AnimatePresence mode="wait">
        <motion.div
          key={dialogue?.text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative bg-white/95 backdrop-blur-md border-[3px] md:border-[4px] border-vibrant-pink rounded-[20px] md:rounded-[24px] p-4 md:p-8 shadow-[0_10px_30px_rgba(216,27,96,0.15)]"
        >
          {/* Speaker Name Tag */}
          <div className="absolute -top-4 md:-top-5 left-6 md:left-10 bg-vibrant-pink text-white px-4 md:px-6 py-1 md:py-1.5 rounded-[10px] md:rounded-[15px] font-bold text-sm md:text-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
            {dialogue?.speaker || ' Neo'}
          </div>

          <div className="min-h-[40px] md:min-h-[60px] text-[#333] text-sm md:text-lg leading-relaxed font-sans">
            {isLoading ? (
              <div className="flex gap-2 items-center h-full">
                <span className="w-2.5 h-2.5 bg-vibrant-pink rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2.5 h-2.5 bg-vibrant-pink rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2.5 h-2.5 bg-vibrant-pink rounded-full animate-bounce"></span>
              </div>
            ) : (
              displayedText
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
