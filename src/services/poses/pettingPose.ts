import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터를 둥기둥기(쓰담쓰담) 해줄 때의 자연스러운 움직임을 적용합니다.
 * @param vrm 모델 객체
 * @param time state.clock.elapsedTime (초 단위 시간)
 * @param intensity 0~1 동작 강도 (서서히 전환하기 위함)
 */
export const applyPettingPose = (vrm: VRM, time: number, intensity: number): void => {
  if (!vrm.humanoid || intensity <= 0.01) return;

  // 척추를 살짝 굽혀서 손을 향해 머리를 낮춤
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    spine.rotation.x -= intensity * 0.1;
  }

  // 팔을 자연스럽게 아주 살짝만 내림 (경직 방지)
  const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
  if (leftUpperArm && rightUpperArm) {
    leftUpperArm.rotation.z -= 0.03 * intensity;
    rightUpperArm.rotation.z += 0.03 * intensity;
  }

  // 고개를 손길에 맞춰 살짝 좌우로 까딱거림
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    const petShake = Math.sin(time * 10) * 0.1 * intensity;
    const petTilt = Math.sin(time * 4) * 0.05 * intensity;
    
    head.rotation.y += petShake;
    head.rotation.z += petTilt;
  }
};
