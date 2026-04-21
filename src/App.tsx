/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { VRMViewer } from './components/vrm/VRMViewer';
import { StatsDisplay } from './components/game/StatsDisplay';
import { DialogueBox } from './components/game/DialogueBox';
import { useGameState } from './hooks/useGameState';
import { Dialogue, Choice, GameStats } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Pizza, Bath, Hand, Moon, Gamepad2, Sunrise, Navigation, FastForward, Heart, Zap, Clock, Sparkles, Brain } from 'lucide-react';
import { getDialogue } from './services/dialogueManager';

export default function App() {
  const { state, updateStats, setMood, interact, advancePhase, useAp, sleepToNextDay, takeNap } = useGameState();
  const [currentAction, setCurrentAction] = useState<'idle' | 'feed' | 'clean' | 'pet' | 'sleep' | 'play'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interactionUI, setInteractionUI] = useState<string | null>(null);
  const [activeChoices, setActiveChoices] = useState<Choice[]>([]);
  
  const [dialogue, setDialogue] = useState<Dialogue>({
    speaker: '콜롬비나',
    text: getDialogue('system', 'greeting'),
    mood: 'neutral'
  });
  const [loading, setLoading] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [mobileStatIndex, setMobileStatIndex] = useState(0);

  const mobileStatsList = [
    { label: '호감도', value: state.happiness, icon: <Heart size={14} className="text-pink-500" />, color: 'bg-pink-500' },
    { label: '체력', value: state.energy, icon: <Zap size={14} className="text-green-500" />, color: 'bg-green-500' },
    { label: '허기', value: state.hunger, icon: <Pizza size={14} className="text-orange-500" />, color: 'bg-orange-500' },
    { label: '청결도', value: state.cleanliness, icon: <Sparkles size={14} className="text-cyan-500" />, color: 'bg-cyan-500' },
    { label: '스트레스', value: state.stress, icon: <Brain size={14} className="text-purple-500" />, color: 'bg-purple-500' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMobileStatIndex((prev) => (prev + 1) % mobileStatsList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mobileStatsList.length]);

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

    const randomEventTimer = setInterval(() => {
      if (Math.random() > 0.4) return;

      const candidates: Array<() => void> = [];

      // 스트레스 기반 특수 이벤트 (가장 우선순위 높음)
      if (state.stress > 80) {
        setMood('sad');
        setDialogue({
          speaker: '콜롬비나',
          text: '...나한테 왜 이래? 가슴이 꽉 막힌 것처럼 답답해. ...숨쉬기 힘들어.',
          mood: 'sad',
          timestamp: Date.now()
        });
        return; // 스트레스 이벤트 발생 시 다른 랜덤 수직 이벤트 무시
      }

      // 1. 체력이 낮을 때 (30미만) - 졸음
      if (state.energy < 30) {
        candidates.push(() => {
          setCurrentAction('sleep');
          setMood('tired');
          // 상호작용 버튼 없이 자연 발동된 수면/휴식이므로, 경미하게 체력을 회복시켜줍니다.
          updateStats({ energy: Math.min(100, state.energy + 5) });
          setDialogue({
            speaker: '콜롬비나',
            text: getDialogue('random', 'sleep'),
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
            text: getDialogue('random', 'hungry'),
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
            text: getDialogue('random', 'dirty'),
            mood: 'sad',
            timestamp: Date.now()
          });
        });
      }

      if (candidates.length > 0) {
        // 부정적인 요소들이 배 열에 담겼다면, 그 중 하나를 무작위로 추첨해 발동
        const event = candidates[Math.floor(Math.random() * candidates.length)];
        event();
      } else if (state.happiness >= 80 && state.stress < 30) {
        // 상태가 모두 멀쩡하고 호감도가 매우 높을 때 (50% 추가 확률로 기분좋은 모션/대사 출력)
        if (Math.random() < 0.5) {
          const isShy = Math.random() > 0.5;
          setMood(isShy ? 'shy' : 'happy');
          setDialogue({
            speaker: '콜롬비나',
            text: isShy ? getDialogue('random', 'shy') : getDialogue('random', 'happy'),
            mood: isShy ? 'shy' : 'happy',
            timestamp: Date.now()
          });
        }
      }
    }, 12000);

    return () => clearInterval(randomEventTimer);
  }, [state.energy, state.hunger, state.cleanliness, state.happiness, state.stress, currentAction, setMood]);

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
          text: getDialogue('system', 'idle_wakeup'),
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

  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current === true && loading === false && state.ap <= 0 && currentAction !== 'sleep') {
      setDialogue({
        speaker: '콜롬비나',
        text: '...살짝 지치네. 잠깐 쉬자.',
        mood: 'tired',
        timestamp: Date.now()
      });
      setMood('tired');
    }
    prevLoading.current = loading;
  }, [loading, state.ap, currentAction, setDialogue, setMood]);

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
            text: getDialogue('system', 'rapid_click_high'),
            mood: 'shy',
            timestamp: Date.now()
          });
        } else {
          setMood('angry');
          setDialogue({
            speaker: '콜롬비나',
            text: getDialogue('system', 'rapid_click_low'),
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

  const getHappinessLevel = (happiness: number): string => {
    if (happiness >= 80) return 'high';
    if (happiness < 30) return 'low';
    return 'normal';
  };

  const openActionMenu = (actionType: 'feed' | 'clean' | 'pet' | 'sleep' | 'play') => {
    if (state.ap <= 0 && actionType !== 'sleep') {
      setDialogue({ speaker: '시스템', text: '시간이 늦었습니다. 다음 시간으로 넘어가거나 수면을 취하세요.', mood: 'neutral', timestamp: Date.now() });
      return;
    }
    
    setInteractionUI(actionType);
    let choices: Choice[] = [];
    let hLevel = getHappinessLevel(state.happiness);
    
    switch (actionType) {
      case 'feed':
        setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `feed_${hLevel}`), mood: 'neutral', timestamp: Date.now() });
        choices = [
          {
            label: '따끈한 빵 주기 (AP 1 소모)',
            apCost: 1,
            action: () => executeFeed('bread')
          },
          {
            label: '수제 샌드위치 주기 (AP 2 소모)',
            apCost: 2,
            action: () => executeFeed('sandwich')
          },
          {
            label: '홍차 끓여주기 (AP 1 소모)',
            apCost: 1,
            action: () => executeFeed('tea')
          }
        ];
        break;
      case 'clean':
        setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `clean_${hLevel}`), mood: 'neutral', timestamp: Date.now() });
        choices = [
          {
            label: '물수건으로 닦아주기 (AP 1 소모)',
            apCost: 1,
            action: () => executeClean('towel')
          },
          {
            label: '목욕 시키기 (AP 2 소모)',
            apCost: 2,
            action: () => executeClean('bath')
          }
        ];
        break;
      case 'pet':
        setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `pet_${hLevel}`), mood: 'neutral', timestamp: Date.now() });
        choices = [
          {
            label: '부드럽게 쓰다듬기 (AP 1 소모)',
            apCost: 1,
            action: () => executePet('soft')
          },
          {
            label: '장난스럽게 헝클어뜨리기 (AP 1 소모)',
            apCost: 1,
            action: () => executePet('tease')
          }
        ];
        break;
      case 'play':
        setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `play_${hLevel}`), mood: 'neutral', timestamp: Date.now() });
        choices = [
          {
            label: '보드게임 하기 (AP 1 소모)',
            apCost: 1,
            action: () => executePlay('boardgame')
          },
          {
            label: '달빛 피하기 놀이 (AP 2 소모)',
            apCost: 2,
            action: () => executePlay('moonlight')
          }
        ];
        break;
      case 'sleep':
        setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `sleep_${hLevel}`), mood: 'neutral', timestamp: Date.now() });
        choices = [
          {
             label: '낮잠 자기 (2시간 경과)',
             apCost: 1, 
             action: () => executeNap()
          },
          {
             label: '재우기 (다음 날로 진행)',
             apCost: state.ap, // uses all remaining AP
             action: () => executeSleep()
          }
        ];
        break;
    }
    setActiveChoices(choices);
  };

  const closeActionMenu = () => {
    setInteractionUI(null);
    setActiveChoices([]);
    setDialogue({ speaker: '콜롬비나', text: getDialogue('interaction', `menu_cancel_${getHappinessLevel(state.happiness)}`), mood: 'neutral', timestamp: Date.now() });
  };

  const applyAction = (actionType: 'idle' | 'feed' | 'clean' | 'pet' | 'sleep' | 'play', text: string, mood: Dialogue['mood'], stats: Partial<GameStats>, apCost: number) => {
    if (state.ap < apCost) return; // safeguard

    setInteractionUI(null);
    setActiveChoices([]);
    setLoading(true);
    setCurrentAction(actionType);
    
    useAp(apCost);
    updateStats(stats);
    
    setDialogue({ speaker: '콜롬비나', text, mood, timestamp: Date.now() });
    if (mood) setMood(mood);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const executeFeed = (type: string) => {
    let text = getDialogue('feed', 'normal');
    let mood: Dialogue['mood'] = 'happy';
    let stats: Partial<GameStats> = { hunger: state.hunger + 20, xp: state.xp + 10, happiness: state.happiness };
    let cost = 1;

    // Use current states mixed with interaction choice
    if (type === 'bread') {
      text = getDialogue('interaction', 'feed_bread') || getDialogue('feed', 'hungry');
      stats.hunger += 25;
      stats.happiness += 5;
    } else if (type === 'sandwich') {
      text = getDialogue('interaction', 'feed_sandwich');
      stats.hunger += 40;
      stats.happiness += 15;
      cost = 2;
      mood = 'excited';
    } else if (type === 'tea') {
      text = getDialogue('interaction', 'feed_tea');
      stats.stress = Math.max(0, state.stress - 15);
      stats.hunger += 10;
      mood = 'neutral';
    }

    if (state.hunger > 80 && type !== 'tea') {
      text = getDialogue('feed', 'full');
      mood = 'neutral';
    }

    applyAction('feed', text, mood, stats, cost);
  };

  const executeClean = (type: string) => {
    let text = getDialogue('clean', 'normal');
    let mood: Dialogue['mood'] = 'neutral';
    let stats: Partial<GameStats> = { cleanliness: 100, xp: state.xp + 5, happiness: state.happiness };
    let cost = 1;

    if (state.happiness < 30 && Math.random() < 0.5) {
      text = getDialogue('interaction', 'reject_clean') || '...내버려 둬. 귀찮게 하지 마.';
      mood = 'angry';
      stats = { happiness: Math.max(0, state.happiness - 5) };
      applyAction('clean', text, mood, stats, cost);
      return;
    }

    if (type === 'towel') {
      text = getDialogue('clean', 'dirty');
      mood = 'happy';
    } else if (type === 'bath') {
      text = getDialogue('interaction', 'clean_bath');
      stats.happiness += 10;
      stats.stress = Math.max(0, state.stress - 20);
      cost = 2;
      mood = 'happy';
      if (state.cleanliness > 80) {
          text = getDialogue('interaction', 'clean_bath_clean');
          mood = 'excited';
      }
    }

    applyAction('clean', text, mood, stats, cost);
  };

  const executePet = (type: string) => {
    let text = getDialogue('pet', 'normal');
    let mood: Dialogue['mood'] = 'excited';
    let stats: Partial<GameStats> = { energy: Math.max(0, state.energy - 5), happiness: Math.min(100, state.happiness + 10), xp: state.xp + 5 };
    let cost = 1;

    if (state.happiness < 30 && Math.random() < 0.5) {
      text = getDialogue('interaction', 'reject_touch') || '...손 대지 마. 기분 나빠.';
      mood = 'angry';
      stats = { happiness: Math.max(0, state.happiness - 5) };
      applyAction('pet', text, mood, stats, cost);
      return;
    }

    if (type === 'soft') {
      if (state.energy < 20) {
        text = getDialogue('pet', 'tired');
        mood = 'tired';
      }
    } else if (type === 'tease') {
      if (state.happiness >= 80) {
        text = getDialogue('interaction', 'pet_tease_high') || '...으음, 그만해애... 조금 간지러워.';
        stats.happiness = Math.min(100, state.happiness + 2);
        mood = 'happy';
      } else {
        text = getDialogue('interaction', 'pet_tease') || '아, 진짜...! 머리 헝클어지잖아. ...뭐, 복수할 거니까 기대해.';
        stats.happiness = Math.max(0, state.happiness - 5);
        mood = 'angry';
      }
    }

    applyAction('pet', text, mood, stats, cost);
  };

  const executePlay = (type: string) => {
    let text = getDialogue('play', 'normal');
    let mood: Dialogue['mood'] = 'excited';
    let stats: Partial<GameStats> = { 
      happiness: Math.min(100, state.happiness + 25), 
      energy: Math.max(0, state.energy - 20),
      hunger: Math.max(0, state.hunger - 15),
      cleanliness: Math.max(0, state.cleanliness - 10),
      xp: state.xp + 20,
      stress: Math.max(0, state.stress - 15)
    };
    let cost = 1;

    if (state.happiness < 30 && Math.random() < 0.5) {
      text = getDialogue('interaction', 'reject_play') || '...됐어. 너랑 놀 기분 아니야.';
      mood = 'angry';
      stats = { happiness: Math.max(0, state.happiness - 5) };
      applyAction('play', text, mood, stats, cost);
      return;
    }

    if (state.energy < 30) {
      text = getDialogue('play', 'tired');
      mood = 'tired';
    } else if (type === 'boardgame') {
      text = getDialogue('interaction', 'play_boardgame');
      stats.energy -= 10;
    } else if (type === 'moonlight') {
      text = getDialogue('interaction', 'play_moonlight');
      stats.happiness += 40;
      stats.energy -= 35;
      stats.stress = 0;
      cost = 2;
      mood = 'happy';
    }

    applyAction('play', text, mood, stats, cost);
  };

  const executeSleep = () => {
    let text = getDialogue('sleep', 'normal');
    
    setInteractionUI(null);
    setActiveChoices([]);
    setLoading(true);
    setCurrentAction('sleep');
    
    // Calls sleepToNextDay which handles all AP, phase, day, and stat resets 
    sleepToNextDay();
    
    setDialogue({ speaker: '콜롬비나', text, mood: 'neutral', timestamp: Date.now() });
    setMood('neutral');

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const executeNap = () => {
    let hLevel = getHappinessLevel(state.happiness);
    let text = getDialogue('interaction', `nap_${hLevel}`) || '...졸려. 잠깐만 눈 좀 붙일게.';
    
    setInteractionUI(null);
    setActiveChoices([]);
    setLoading(true);
    setCurrentAction('sleep');
    
    // Call takeNap from hook
    takeNap();
    
    setDialogue({ speaker: '콜롬비나', text, mood: 'neutral', timestamp: Date.now() });
    setMood('neutral');

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

      {/* 💻 PC UI (Desktop Layout) */}
      <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
        <StatsDisplay state={state} />

        <AnimatePresence>
          {!interactionUI && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-auto flex flex-col gap-5"
            >
              {[
                { icon: <Pizza size={28} />, label: '밥먹이기', onClick: () => openActionMenu('feed'), disabled: state.ap <= 0 },
                { icon: <Bath size={28} />, label: '씻기기', onClick: () => openActionMenu('clean'), disabled: state.ap <= 0 },
                { icon: <Hand size={28} />, label: '쓰담쓰담', onClick: () => openActionMenu('pet'), disabled: state.ap <= 0 },
                { icon: <Gamepad2 size={28} />, label: '놀아주기', onClick: () => openActionMenu('play'), disabled: state.ap <= 0 },
                { icon: <Moon size={28} />, label: '재우기', onClick: () => openActionMenu('sleep'), disabled: state.ap <= 0 },
                { 
                  icon: <FastForward size={28} />, 
                  label: '시간보내기', 
                  onClick: () => {
                    advancePhase();
                    setDialogue({speaker:'시스템', text:'다음 시간으로 이동했습니다.', mood: 'neutral', timestamp: Date.now()});
                  },
                  disabled: false
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  disabled={loading || btn.disabled}
                  className="group relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-none shadow-[0_6px_15px_rgba(255,105,180,0.3)] cursor-pointer flex flex-col justify-center items-center gap-1 transition-all duration-200 hover:scale-110 hover:bg-[#fff0f5] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-95"
                >
                  <span className="text-vibrant-accent group-hover:scale-110 transition-transform">
                    {btn.icon}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold text-vibrant-accent uppercase tracking-tighter">
                    {btn.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <DialogueBox 
          dialogue={dialogue} 
          isLoading={loading} 
          onSpeakingChange={setIsSpeaking}
        />
      </div>

      {/* 📱 Mobile UI (Mobile Layout) */}
      <div className="md:hidden flex flex-col justify-between absolute inset-0 z-20 pointer-events-none p-4">
        {/* Mobile Top: Compact Stats */}
        <div className="w-full flex justify-between gap-2 pt-safe pointer-events-auto">
          {/* Rotating Stats Ticker */}
          <div 
            className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-vibrant-light-pink text-xs font-bold text-vibrant-dark flex-[2] flex flex-col justify-center items-center gap-1 active:scale-98 transition-transform cursor-pointer"
            onClick={() => setShowStatsModal(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={mobileStatIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center w-full gap-1"
              >
                <div className="flex items-center gap-2">
                  {mobileStatsList[mobileStatIndex].icon}
                  <span className="text-vibrant-accent uppercase tracking-tighter text-[10px]">
                    {mobileStatsList[mobileStatIndex].label}
                  </span>
                  <span className="text-gray-900">{Math.round(mobileStatsList[mobileStatIndex].value)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                   <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${mobileStatsList[mobileStatIndex].value}%` }}
                      className={`h-full ${mobileStatsList[mobileStatIndex].color}`} 
                   />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div 
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-sm border border-vibrant-light-pink text-xs font-bold text-vibrant-dark flex-1 flex flex-col items-center justify-center gap-0.5" 
          >
            <div className="flex items-center gap-1"><Clock size={12} className="text-blue-500" /> Day {state.day}</div>
            <div className="text-[10px] text-vibrant-pink leading-none">{state.phase} <span className="text-gray-400 ml-1">AP:{state.ap}</span></div>
          </div>
        </div>

        {/* Mobile Center: Empty to show Columbina */}
        <div className="flex-1" />

        {/* Mobile Bottom: Dialogue and Interaction Buttons */}
        <div className="w-full pointer-events-auto space-y-3 pb-safe">
          {/* Compact Dialogue Box for Mobile */}
          <DialogueBox 
            dialogue={dialogue} 
            isLoading={loading} 
            onSpeakingChange={setIsSpeaking}
            className="relative w-full z-20"
          />
          
          <AnimatePresence>
            {!interactionUI && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { icon: <Pizza size={20} />, label: '식사', onClick: () => openActionMenu('feed'), disabled: state.ap <= 0 },
                  { icon: <Bath size={20} />, label: '씻기', onClick: () => openActionMenu('clean'), disabled: state.ap <= 0 },
                  { icon: <Hand size={20} />, label: '쓰담', onClick: () => openActionMenu('pet'), disabled: state.ap <= 0 },
                  { icon: <Gamepad2 size={20} />, label: '놀기', onClick: () => openActionMenu('play'), disabled: state.ap <= 0 },
                  { icon: <Moon size={20} />, label: '수면', onClick: () => openActionMenu('sleep'), disabled: state.ap <= 0 },
                  { 
                    icon: <FastForward size={20} />, 
                    label: '이동', 
                    onClick: () => {
                      advancePhase();
                      setDialogue({speaker:'시스템', text:'다음 시간으로 이동했습니다.', mood: 'neutral', timestamp: Date.now()});
                    },
                    disabled: false
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={loading || btn.disabled}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/95 border border-vibrant-light-pink shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-vibrant-accent mb-1">{btn.icon}</span>
                    <span className="text-[10px] font-bold text-vibrant-accent">{btn.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Stats Modal Overlay */}
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md md:hidden flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setShowStatsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <StatsDisplay 
                state={state} 
                className="relative flex flex-col gap-4 scale-90 md:scale-100"
              />
              <button 
                className="mt-4 w-full bg-white/20 text-white rounded-full py-2 font-bold text-sm border border-white/30 backdrop-blur-sm"
                onClick={() => setShowStatsModal(false)}
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice Menu Overlay (Shared) */}
      <AnimatePresence>
        {interactionUI && activeChoices.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 w-[min(90vw,320px)] md:w-[400px] pointer-events-auto text-sm"
          >
            {activeChoices.map((choice, idx) => (
              <button
                key={idx}
                onClick={choice.action}
                disabled={state.ap < (choice.apCost || 0)}
                className="w-full relative overflow-hidden group bg-white/95 backdrop-blur-md border-[3px] border-vibrant-pink rounded-[20px] p-4 text-center font-bold text-vibrant-dark shadow-[0_8px_20px_rgba(255,105,180,0.2)] hover:bg-[#fff0f5] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
              >
                {choice.label}
              </button>
            ))}
            <button
               onClick={closeActionMenu}
               className="w-full mt-2 bg-gray-200 text-gray-700 rounded-[20px] p-3 text-center font-bold shadow-md hover:bg-gray-300 transition-colors"
            >
               취소
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


