/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VRMViewer } from './components/vrm/VRMViewer';
import { StatsDisplay } from './components/game/StatsDisplay';
import { DialogueBox } from './components/game/DialogueBox';
import { useGameState } from './hooks/useGameState';
import { Dialogue } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, Bath, Hand, Moon, Gamepad2 } from 'lucide-react';

export default function App() {
  const { state, updateStats, setMood, interact } = useGameState();
  const [currentAction, setCurrentAction] = useState<'idle' | 'feed' | 'clean' | 'pet' | 'sleep' | 'play'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dialogue, setDialogue] = useState<Dialogue>({
    speaker: '콜롬비나',
    text: "흥... 드디어 왔어? 내가 기다린 건 절대 아니니까 착각하지 마! 그냥 네가 너무 늦어서 짜증났을 뿐이야.",
    mood: 'neutral'
  });
  const [loading, setLoading] = useState(false);

  // 자동 기분 복구 및 극단적 상태 처리
  useEffect(() => {
    // 1. 배고픔이나 청결도가 0이면 방치 상태이므로 무조건 슬픔 유지
    if (state.hunger === 0 || state.cleanliness === 0) {
      if (state.mood !== 'sad') {
        setMood('sad');
      }
      return; // 중립 회귀 로직 중단
    }

    // 2. 다른 감정은 5초 후 평상시(중립) 상태로 자연스럽게 복구
    if (state.mood !== 'neutral' && state.mood !== 'sad' && !loading) {
      const timer = setTimeout(() => {
        setMood('neutral');
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [state.mood, loading, state.hunger, state.cleanliness, setMood]);

  // 스탯 기반 무작위 감정/행동 발동 (Random Events)
  useEffect(() => {
    if (currentAction !== 'idle') return; // 다른 행동 중일 땐 방해 금지

    // 12초마다 한 번씩 스탯을 확인하여 이벤트를 발생시킬지 확률적으로 결정 (40% 확률로 이벤트 발생)
    const randomEventTimer = setInterval(() => {
      if (Math.random() > 0.4) return;

      const candidates: Array<() => void> = [];

      // 1. 체력이 낮을 때 (30미만) - 졸음
      if (state.energy < 30) {
        candidates.push(() => {
          setCurrentAction('sleep');
          setMood('tired');
          // 상호작용 버튼 없이 자연 발동된 수면/휴식이므로, 경미하게 체력을 회복시켜줍니다.
          updateStats({ energy: Math.min(100, state.energy + 5) });
          setDialogue({
            speaker: '콜롬비나',
            text: '으음... 너무 피곤해... 자꾸 눈이 감겨...',
            mood: 'tired',
            timestamp: Date.now()
          });
        });
      }

      // 2. 허기가 낮을 때 (30미만) - 짜증
      if (state.hunger < 30) {
        candidates.push(() => {
          setMood('angry');
          setDialogue({
            speaker: '콜롬비나',
            text: '아 진짜! 꼬르륵거리잖아! 나 언제까지 굶길 셈이야?!',
            mood: 'angry',
            timestamp: Date.now()
          });
        });
      }

      // 3. 청결도가 낮을 때 (30미만) - 슬픔/찝찝함
      if (state.cleanliness < 30) {
        candidates.push(() => {
          setMood('sad');
          setDialogue({
            speaker: '콜롬비나',
            text: '으으... 뭔가 찝찝해... 씻고 싶은데 기분이 영 아니네...',
            mood: 'sad',
            timestamp: Date.now()
          });
        });
      }

      if (candidates.length > 0) {
        // 부정적인 요소들이 배 열에 담겼다면, 그 중 하나를 무작위로 추첨해 발동
        const event = candidates[Math.floor(Math.random() * candidates.length)];
        event();
      } else if (state.happiness >= 80) {
        // 상태가 모두 멀쩡하고 호감도가 매우 높을 때 (50% 추가 확률로 기분좋은 모션/대사 출력)
        if (Math.random() < 0.5) {
          const isShy = Math.random() > 0.5;
          setMood(isShy ? 'shy' : 'happy');
          setDialogue({
            speaker: '콜롬비나',
            text: isShy 
              ? '...뭘 그렇게 쳐다봐? 바보. 부끄럽게...'
              : '흥흥~♪ 너랑 노는 것도 꽤 나쁘지 않은 거 같아!',
            mood: isShy ? 'shy' : 'happy',
            timestamp: Date.now()
          });
        }
      }
    }, 12000);

    return () => clearInterval(randomEventTimer);
  }, [state.energy, state.hunger, state.cleanliness, state.happiness, currentAction, setMood]);

  // 마우스 웨이크업 (방치 감지)
  useEffect(() => {
    let lastTime = Date.now();
    let idleTimer: NodeJS.Timeout;
    let isIdle = false;

    const handleMouseMove = () => {
      const now = Date.now();
      if (isIdle) { 
        // 방치 상태에서 유저가 돌아왔을 때 -> 깜짝 놀람
        setMood('surprised');
        setDialogue({
          speaker: '콜롬비나',
          text: '앗! 으음... 뭐야, 언제 온 거야? 깜짝 놀랐잖아!',
          mood: 'surprised',
          timestamp: Date.now()
        });
        setCurrentAction('idle');
        isIdle = false;
      }
      lastTime = now;
      clearTimeout(idleTimer);
      
      // 3분(180,000ms) 방치 시 -> 꾸벅꾸벅 졸음
      idleTimer = setTimeout(() => {
        isIdle = true;
        setCurrentAction('sleep');
        setMood('tired');
      }, 180000); 
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseMove);

    // 최초 타이머 시작
    idleTimer = setTimeout(() => {
      isIdle = true;
      setCurrentAction('sleep');
      setMood('tired');
    }, 180000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      clearTimeout(idleTimer);
    };
  }, [setMood]);

  // 광클 (Rapid Click) 처리
  const clickTimesRef = useRef<number[]>([]);

  const handleRapidClick = () => {
    if (loading) return; // 다른 모션 진행 중엔 무시
    const now = Date.now();
    
    // 1초 이내의 클릭 기록만 남기기
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1000);
    clickTimesRef.current.push(now);

    // 1초에 4번 이상 다다닥 클릭할 경우
    if (clickTimesRef.current.length >= 4) {
      clickTimesRef.current = []; // 초기화

      setMood('surprised'); // 일단 깜짝 놀람
      setLoading(true);

      setTimeout(() => {
        // 잠시 후 호감도에 따라 반응 갈림
        if (state.happiness >= 50) {
          setMood('shy');
          setDialogue({
            speaker: '콜롬비나',
            text: "앗 깜짝이야! ...그, 그렇게 확 만지면 부끄럽잖아... 바보야.",
            mood: 'shy',
            timestamp: Date.now()
          });
        } else {
          setMood('angry');
          setDialogue({
            speaker: '콜롬비나',
            text: "앗 깜짝이야! 장난치지 마! 진짜 화낸다?!",
            mood: 'angry',
            timestamp: Date.now()
          });
        }
        setLoading(false);
      }, 1500); // 1.5초 후 감정 이어짐
    } else {
      // 일반 클릭(쓰담) 처리 고려: 원한다면 여기에 그냥 쓰담 모션을 넣거나 무시할 수 있음.
      // 현재는 광클 장난 용도로만 동작.
    }
  };

  const handleAction = async (actionType: 'feed' | 'clean' | 'pet' | 'sleep' | 'play') => {
    setLoading(true);
    setCurrentAction(actionType);
    
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
      <div 
        className="absolute inset-0 z-10 flex justify-center items-center"
        onClick={handleRapidClick}
      >
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

      {/* Interaction Menu (Right Side) */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-5">
        {[
          { icon: <Pizza size={28} />, label: '밥먹이기', type: 'feed' as const },
          { icon: <Bath size={28} />, label: '씻기기', type: 'clean' as const },
          { icon: <Hand size={28} />, label: '쓰담쓰담', type: 'pet' as const },
          { icon: <Moon size={28} />, label: '재우기', type: 'sleep' as const },
          { icon: <Gamepad2 size={28} />, label: '놀아주기', type: 'play' as const },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleAction(btn.type)}
            disabled={loading}
            className="group relative w-20 h-20 rounded-full bg-white border-none shadow-[0_6px_15px_rgba(255,105,180,0.3)] cursor-pointer flex flex-col justify-center items-center gap-1 transition-all duration-200 hover:scale-110 hover:bg-[#fff0f5] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-95"
          >
            <span className="text-vibrant-accent group-hover:scale-110 transition-transform">
              {btn.icon}
            </span>
            <span className="text-[10px] font-bold text-vibrant-accent uppercase tracking-tighter">
              {btn.label}
            </span>
          </button>
        ))}
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


