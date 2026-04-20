import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터가 깜짝 놀랐을 때의 포즈를 적용합니다.
 * 팔 관절 리깅을 보호하기 위해, 팔과 어깨는 건드리지 않고 상체(spine)와 고개(head)만 뒤로 젖히게 합니다.
 */
export const applySurprisedPose = (vrm: VRM, time: number, intensity: number): void => {
  if (!vrm.humanoid || intensity <= 0.01) return;

  // 상체를 뒤로 젖히고 미세하게 떨림 (팔은 건드리지 않음)
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    const rapidBreath = Math.sin(time * 15) * 0.01;
    spine.rotation.x -= (0.15 + rapidBreath) * intensity; 
  }

  // 팔을 아주 살짝만 들어올림 (경직 방지용 미세 동작)
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
  if (leftUpperArm && rightUpperArm) {
    leftUpperArm.rotation.z += 0.08 * intensity; // 바깥으로 살짝
    rightUpperArm.rotation.z -= 0.08 * intensity;
  }
  
  // 머리를 놀란 듯이 위로 살짝 들기
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    head.rotation.x -= 0.1 * intensity;
  }
};
