import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터를 둥기둥기(쓰담쓰담) 해줄 때의 자연스러운 움직임을 적용합니다.
 * @param vrm 모델 객체
 * @param phase 부드럽게 누적된 애니메이션 위상 (위상 점프 방지)
 * @param intensity 0~1 동작 강도 (서서히 전환하기 위함)
 */
export const applyPettingPose = (vrm: VRM, phase: number, intensity: number): void => {
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

  // 고개를 손길에 맞춰 살짝 좌우/위아래로 까딱거림
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    // phase는 외부(VRMViewer)에서 쓰다듬는 속도에 비례해 부드럽게 누적된 값입니다.
    // 각도 범위를 크게 늘려 움직임이 더 확실해 보이도록 각도 계수를 상향 조정
    const petShake = Math.sin(phase * 4) * 0.20 * intensity; // 좌우 도리도리 (기존 0.10 -> 0.20)
    const petTilt = Math.sin(phase * 2) * 0.10 * intensity; // 좌우 갸웃거림 (기존 0.05 -> 0.10)
    const petNod = Math.sin(phase * 3) * 0.15 * intensity; // 위아래 끄덕임 (기존 0.06 -> 0.15)
    
    head.rotation.x += petNod;
    head.rotation.y += petShake;
    head.rotation.z += petTilt;
  }
};
