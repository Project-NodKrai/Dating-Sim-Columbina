import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터를 살아있는 것처럼 자연스럽게 세워둡니다. (평상시 Idle 자세)
 * @param vrm 모델 객체
 * @param time state.clock.elapsedTime (초 단위 시간)
 */
export const applyNaturalStandPose = (vrm: VRM, time: number = 0): void => {
  if (!vrm.humanoid) return;

  // 1. 숨쉬기 리듬 (부드러운 사인파)
  const breath = Math.sin(time * 1.5) * 0.04;

  // 2. 상체 (Spine): 살짝 앞으로 숙여야 거북목/뻣뻣함이 사라짐
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    // xyz 값을 명시적으로 초기화 
    spine.rotation.set(0.05 + (breath * 0.5), 0, 0); 
  }

  // 3. 팔 (Arms): 핵심은 팔꿈치와 어깨의 각도
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
  const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
  const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');

  if (leftUpperArm && rightUpperArm) {
    leftUpperArm.rotation.set(0.1, 0.1, -1.3 + breath); 
    rightUpperArm.rotation.set(0.1, -0.1, 1.3 - breath);
  }

  if (leftLowerArm && rightLowerArm) {
    leftLowerArm.rotation.set(0, -0.2, 0); 
    rightLowerArm.rotation.set(0, 0.2, 0);
  }

  // 4. 머리 (Head): 가볍게 숨쉬기에 맞춰 까딱임
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    // x, y, z를 전부 명시적으로 0 베이스로 잡아주어 다른 파일에서 누적(+=) 시 발산을 방지합니다.
    head.rotation.set(0, Math.sin(time * 0.5) * 0.03, 0);
  }

  // 5. 다리 (Legs)
  const leftUpperLeg = vrm.humanoid.getNormalizedBoneNode('leftUpperLeg');
  const rightUpperLeg = vrm.humanoid.getNormalizedBoneNode('rightUpperLeg');
  if (leftUpperLeg) leftUpperLeg.rotation.set(0, 0, -0.06);
  if (rightUpperLeg) rightUpperLeg.rotation.set(0, 0, 0.06);
};
