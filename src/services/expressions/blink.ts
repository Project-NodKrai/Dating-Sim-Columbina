import { VRM } from '@pixiv/three-vrm';
import { Mood } from '../../types';

/**
 * Updates the VRM blinking expression based on the current time and mood.
 * Creates a smooth 0 -> max -> 0 sine-based curve for natural blinking.
 * 눈을 조정하는 표정의 수치만큼 눈 깜빡임(Blink) 최대치를 동적으로 줄여 충돌을 방지합니다.
 * 
 * @param vrm The VRM instance to update
 * @param time The current clock time in seconds
 * @param mood The current mood state to evaluate eye shape
 * @param isSleeping Whether the character is sleeping (forced 1.0)
 */
export const updateBlink = (vrm: VRM, time: number, mood: Mood = 'neutral', isSleeping: boolean = false): void => {
  if (!vrm.expressionManager) return;

  // 1. 현재 표정(mood)에 의해 눈이 기본적으로 얼마나 감겨있는지(baseClosed) 계산
  let baseClosedAmount = 0;
  switch (mood) {
    case 'happy':
    case 'excited':
    case 'sad':
      baseClosedAmount = 1.0;
      break;
    case 'shy':
      baseClosedAmount = 0.8; // happy 0.5 + relaxed 0.5
      break;
    case 'angry':
      baseClosedAmount = 0.6; // angry 1.0 + sad 0.5
      break;
    case 'tired':
      baseClosedAmount = 0.6; // relaxed 0.6
      break;
    case 'surprised':
    case 'neutral':
    default:
      baseClosedAmount = 0.0;
      break;
  }

  // 2. 수면 상태(재우기)일 때 과도한 중첩으로 징그럽게 찢어지는 현상 방지 보정
  if (isSleeping) {
    // 이미 표정으로 눈이 감긴 차이(1.0 - 기본 감김수치) 만큼만 보정하여 눈을 마저 감음
    const sleepBlink = Math.max(0, 1.0 - baseClosedAmount);
    vrm.expressionManager.setValue('blink', sleepBlink);
    return;
  }

  // 3. 평상시 깜빡임 한도 (maxBlink) 계산
  let maxBlink = Math.max(0, 1.0 - baseClosedAmount);
  
  // 요청사항: Tired일 때 평상시 껌뻑거림은 기본(Neutral) 상태와 동일한 1.0(100%) 비율로 온전히 이루어지도록 예외 허용
  if (mood === 'tired') {
    maxBlink = 1.0; 
  }

  // 4. 깜빡임 값이 0 이하로 떨어지면 아예 깜빡이지 않음 (예: 슬픔/미소 등)
  if (maxBlink <= 0.01) {
    vrm.expressionManager.setValue('blink', 0);
    return;
  }

  let blinkValue = 0;

  // Blinks every 4 seconds, takes 0.2 seconds to complete
  const blinkPeriod = 4.0;
  const blinkDuration = 0.2;
  const remainder = time % blinkPeriod;

  if (remainder < blinkDuration) {
    // Create a smooth 0 -> maxBlink -> 0 curve using Sine
    blinkValue = Math.sin((remainder / blinkDuration) * Math.PI) * maxBlink;
  }

  vrm.expressionManager.setValue('blink', blinkValue);
};
