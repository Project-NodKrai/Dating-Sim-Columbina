import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터를 살아있는 것처럼 자연스럽게 세워둡니다.
 * @param vrm 모델 객체
 * @param time state.clock.elapsedTime (초 단위 시간)
 * @param pettingIntensity 쓰담기 반응 강도 (0~1)
 */
export const applyNaturalStandPose = (vrm: VRM, time: number = 0, pettingIntensity: number = 0): void => {
  if (!vrm.humanoid) return;

  // 1. 숨쉬기 리듬 (부드러운 사인파)
  const breath = Math.sin(time * 1.5) * 0.04;

  // 2. 상체 (Spine): 살짝 앞으로 숙여야 거북목/뻣뻣함이 사라짐
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    spine.rotation.x = 0.05 + (breath * 0.5) - (pettingIntensity * 0.1); 
  }

  // 3. 팔 (Arms): 핵심은 팔꿈치와 어깨의 각도
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');

  if (leftUpperArm && rightUpperArm) {
    // 쓰담기 시 팔을 더 벌리거나 움츠리는 효과
    const armSpread = pettingIntensity * 0.2;
    leftUpperArm.rotation.set(0.1, 0.1, -1.3 + breath - armSpread); 
    rightUpperArm.rotation.set(0.1, -0.1, 1.3 - breath + armSpread);
  }

  if (leftLowerArm && rightLowerArm) {
    leftLowerArm.rotation.y = -0.2; 
    rightLowerArm.rotation.y = 0.2;
  }

  // 4. 머리 (Head): 유저를 향해 고개를 까딱임 (쓰담쓰담 반응)
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    // 쓰담기 시 고개를 살짝 좌우로 흔듬
    const petShake = Math.sin(time * 10) * 0.1 * pettingIntensity;
    head.rotation.y = (Math.sin(time * 0.5) * 0.03) + petShake;
    head.rotation.z = Math.sin(time * 4) * 0.05 * pettingIntensity;
  }

  // 5. 다리 (Legs)
  const leftUpperLeg = vrm.humanoid.getNormalizedBoneNode('leftUpperLeg');
  const rightUpperLeg = vrm.humanoid.getNormalizedBoneNode('rightUpperLeg');
  if (leftUpperLeg) leftUpperLeg.rotation.z = -0.06;
  if (rightUpperLeg) rightUpperLeg.rotation.z = 0.06;
};
