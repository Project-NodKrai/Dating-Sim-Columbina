import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터가 말하는 것처럼 입을 달싹이게 합니다.
 * 
 * @param vrm VRM 인스턴스
 * @param time 현재 시간
 * @param isSpeaking 현재 말하고 있는지 여부
 */
export const updateChatter = (vrm: VRM, time: number, isSpeaking: boolean): void => {
  if (!vrm.expressionManager) return;

  if (isSpeaking) {
    // 말할 때 입을 오물거리는 리듬 (0.1초 ~ 0.3초 주기의 불규칙한 느낌 유도)
    const baseFreq = 15;
    const noise = Math.sin(time * baseFreq * 0.7) * 0.2;
    let mouthValue = Math.max(0, Math.sin(time * baseFreq) * 0.5 + 0.3 + noise);
    
    // 입을 너무 크게 벌리지 않도록 제한 (적당히 달싹이는 느낌)
    mouthValue = Math.min(0.6, mouthValue);

    vrm.expressionManager.setValue('aa', mouthValue);
  } else {
    // 말하기가 끝났을 때만 명시적으로 0으로 한 번 보내줄 필요가 있지만, 
    // 여기서는 단순히 true가 아닐 때 0으로 설정하면 다른 애니메이션(먹기 등)과 충돌합니다.
    // 그래서 isSpeaking이 false일 때는 'aa'를 건드리지 않도록 합니다.
    // 단, 대화가 끝나는 시점에 입을 다물게 하는 로직은 DialogueBox의 타이머 종료 시점에 맞춰 실행되거나
    // 다른 기본 포즈(idle)에서 관리하게 하는 것이 좋습니다.
    
    // 하지만 idle 상태에서 입을 벌리고 있으면 이상하므로, 
    // speaking이 아닐 때 아주 서서히(또는 즉시) 0으로 수렴하게 하되 다른 애니메이션이 값을 쓰고 있다면 양보해야 합니다.
  }
};
