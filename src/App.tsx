/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VRMViewer } from './components/vrm/VRMViewer';
import { StatsDisplay } from './components/game/StatsDisplay';
import { DialogueBox } from './components/game/DialogueBox';
import { useGameState } from './hooks/useGameState';
import { Dialogue } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, Bath, Hand, Moon, Gamepad2, Plus, X } from 'lucide-react';

export default function App() {
  const { state, updateStats, setMood, interact } = useGameState();
  const [currentAction, setCurrentAction] = useState<'idle' | 'feed' | 'clean' | 'pet' | 'sleep' | 'play'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue>({
    speaker: '콜롬비나',
    text: "흥... 드디어 왔어? 내가 기다린 건 절대 아니니까 착각하지 마! 그냥 네가 너무 늦어서 짜증났을 뿐이야.",
    mood: 'neutral'
  });
  const [loading, setLoading] = useState(false);

  // 자동 기분 복구 (중립으로 회귀)
  useEffect(() => {
    if (state.mood !== 'neutral' && !loading) {
      const timer = setTimeout(() => {
        setMood('neutral');
      }, 5000); // 5초 후 평상시 상태로 복구
      return () => clearTimeout(timer);
    }
  }, [state.mood, loading, setMood]);

  const handleAction = async (actionType: 'feed' | 'clean' | 'pet' | 'sleep' | 'play') => {
    setLoading(true);
    setCurrentAction(actionType);
    setIsMenuOpen(false);
    
    let text = '';
    let mood: Dialogue['mood'] = 'neutral';

    switch (actionType) {
      case 'feed':
        updateStats({ hunger: Math.min(100, state.hunger + 20), xp: state.xp + 10 });
        if (state.hunger < 30) {
          text = "아... 진짜 배고팠는데... 고마워. 이번만 특별히 인사해주는 거야.";
          mood = 'happy';
        } else if (state.hunger > 80) {
          text = "이제 배불러... 꼭 더 먹여야겠어? 뭐, 맛은 있네.";
          mood = 'neutral';
        } else {
          text = "맛있어! 고마워. 너 오늘 좀 친절하네?";
          mood = 'happy';
        }
        break;
      case 'clean':
        updateStats({ cleanliness: 100, xp: state.xp + 5 });
        if (state.cleanliness < 50) {
          text = "으으... 지저분한 건 딱 질색이야. 깨끗해지니까 좀 낫네.";
          mood = 'neutral';
        } else {
          text = "아... 깨끗해진 건 좋은데, 꼭 이렇게 씻겨줘야 했어? 부끄럽단 말이야!";
          mood = 'angry';
        }
        break;
      case 'pet':
        updateStats({ energy: Math.max(0, state.energy - 5), happiness: Math.min(100, state.happiness + 10), xp: state.xp + 5 });
        if (state.energy < 20) {
          text = "하아... 피곤해... 이제 그만 놀면 안 될까?";
          mood = 'tired';
        } else {
          text = "에헤헤... 쓰담쓰담 기분 좋아... 아, 아냐! 그냥 머리가 좀 가려웠을 뿐이라고!";
          mood = 'excited';
        }
        break;
      case 'sleep':
        updateStats({ 
          energy: Math.min(100, state.energy + 40), 
          hunger: Math.max(0, state.hunger - 10),
          xp: state.xp + 5 
        });
        text = "으음... 졸려... 잘 자라고 말해주는 거야? 고마워... 잘 자...";
        mood = 'neutral';
        break;
      case 'play':
        updateStats({ 
          happiness: Math.min(100, state.happiness + 25), 
          energy: Math.max(0, state.energy - 25),
          hunger: Math.max(0, state.hunger - 15),
          cleanliness: Math.max(0, state.cleanliness - 15),
          xp: state.xp + 20 
        });
        if (state.energy < 30) {
          text = "지쳐... 너무 많이 논 거 같아. 그래도 기분은 최고야!";
          mood = 'happy';
        } else {
          text = "와아! 신난다! 더 신나게 놀아보자! 너 의외로 놀아주는 법을 아네?";
          mood = 'excited';
        }
        break;
    }

    setDialogue({ 
      speaker: '콜롬비나', 
      text, 
      mood,
      timestamp: Date.now() 
    });
    setMood(mood);
    
    // 2초간 쿨타임 (버튼 비활성화 유지)
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 bg-vibrant-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#fff9fb_0%,#ffd1dc_100%)]" />
      </div>

      {/* 3D Model Layer */}
      <div className="absolute inset-0 z-10 flex justify-center items-center">
        <div className="w-full h-full">
          <VRMViewer 
            mood={state.mood} 
            action={currentAction}
            isSpeaking={isSpeaking}
            onActionComplete={() => setCurrentAction('idle')}
          />
        </div>
      </div>

      {/* Stats HUD */}
      <StatsDisplay state={state} />

      {/* Interaction Menu (Expandable Dial) */}
      <div className="absolute right-10 bottom-10 z-20">
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {[
                { icon: <Pizza size={24} />, label: '밥먹이기', type: 'feed' as const, angle: -90 },
                { icon: <Bath size={24} />, label: '씻기기', type: 'clean' as const, angle: -125 },
                { icon: <Hand size={24} />, label: '쓰담쓰담', type: 'pet' as const, angle: -160 },
                { icon: <Moon size={24} />, label: '재우기', type: 'sleep' as const, angle: -195 },
                { icon: <Gamepad2 size={24} />, label: '놀아주기', type: 'play' as const, angle: -230 },
              ].map((btn, index) => {
                const radius = 120;
                const rad = (btn.angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                return (
                  <motion.button
                    key={btn.label}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1, x, y }}
                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 20,
                      delay: index * 0.03 
                    }}
                    onClick={() => handleAction(btn.type)}
                    disabled={loading}
                    className="absolute left-1/2 top-1/2 -ml-8 -mt-8 w-16 h-16 rounded-full bg-white border-none shadow-[0_4px_12px_rgba(255,105,180,0.2)] cursor-pointer flex flex-col justify-center items-center font-sans transition-all duration-200 hover:scale-110 hover:bg-[#fff0f5] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-vibrant-accent group-hover:scale-110 transition-transform">
                      {btn.icon}
                    </span>
                    <span className="text-[8px] font-bold text-vibrant-accent uppercase tracking-tighter">
                      {btn.label}
                    </span>
                  </motion.button>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Main Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`relative z-30 w-20 h-20 rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(255,105,180,0.4)] transition-all duration-300 ${
            isMenuOpen ? 'bg-vibrant-accent' : 'bg-white'
          }`}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {isMenuOpen ? (
              <X size={32} className="text-white" />
            ) : (
              <Plus size={32} className="text-vibrant-accent" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Dialogue System */}
      <DialogueBox 
        dialogue={dialogue} 
        isLoading={loading} 
        onSpeakingChange={setIsSpeaking}
      />
    </div>
  );
}


