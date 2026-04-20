import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터가 조는(Sleep) 모션을 적용합니다. 꾸벅꾸벅 조는 움직임을 표현합니다.
 */
export const applySleepPose = (vrm: VRM, time: number, intensity: number): void => {
  if (!vrm.humanoid || intensity <= 0.01) return;

  // 척추를 약간 구부림 (힘이 빠진 상태)
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    spine.rotation.x += 0.05 * intensity; 
  }

  // 머리가 꾸벅꾸벅 아래로 향했다가 움찔하며 올라가는(Nodding) 애니메이션
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    // Math.sin을 활용하여 천천히 고개가 내려가다 튕기듯 올라오는 거 같은 형태
    // sin 파형이 양수일 때 고개를 숙이도록 조정 (0.1 ~ 0.3 라디안 부근 추가 숙임)
    const nodWave = Math.sin(time * 1.5);
    // nodWave가 1에 가까울수록 머리가 깊게 내려가고, -1에 가까울수록 원래 위치(살짝 덜 숙임)로
    const noddingPitch = (nodWave * 0.15 + 0.15) * intensity; 
    head.rotation.x += noddingPitch;

    // 약간 좌우로 기울어짐 (목에 힘이 풀려 흔들림)
    const nodRoll = Math.sin(time * 0.8) * 0.05 * intensity;
    head.rotation.z += nodRoll;
  }
};
