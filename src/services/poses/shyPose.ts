import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터가 부끄러워할 때의 포즈를 적용합니다.
 * 팔 관절 리깅을 고려하여, 팔 움직임은 배제하고 몸을 꼬거나 고개를 숙이는 모션만 적용합니다.
 */
export const applyShyPose = (vrm: VRM, time: number, intensity: number): void => {
  if (!vrm.humanoid || intensity <= 0.01) return;

  // 몸을 좌우로 살랑살랑 흔들며 비비 꼬는 느낌 (한쪽 고정에서 좌우 왕복으로 변경)
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    // y축(비틀기)과 z축(기울기) 모두 시간에 따라 좌우로 왕복하도록 sin/cos 사용
    spine.rotation.y += Math.sin(time * 1.5) * 0.06 * intensity; 
    spine.rotation.z += Math.cos(time * 1.5) * 0.04 * intensity; 
  }

  // 팔을 몸쪽으로 아주 살짝 붙임 (너무 뻣뻣하지 않게)
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
  if (leftUpperArm && rightUpperArm) {
    leftUpperArm.rotation.z -= 0.05 * intensity; // 안쪽으로 살짝
    rightUpperArm.rotation.z += 0.05 * intensity;
  }

  // 고개를 아래로 떨구고 몸통 움직임에 맞춰 고개도 좌우로 살짝씩 향함
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    head.rotation.x += 0.15 * intensity; // 고개 숙임 유지
    head.rotation.y += Math.sin(time * 1.5) * 0.1 * intensity; // 좌우로 시선 회피
  }
};
