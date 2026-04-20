import { VRM } from '@pixiv/three-vrm';

/**
 * 캐릭터와 놀아줄 때의 활기찬 움직임을 적용합니다.
 * @param vrm 모델 객체
 * @param time state.clock.elapsedTime (초 단위 시간)
 * @param intensity 0~1 동작 강도
 */
export const applyPlayPose = (vrm: VRM, time: number, intensity: number): void => {
  if (!vrm.humanoid || intensity <= 0.01) return;

  // 신나게 어깨/상체를 위아래로 흔듦 (신남 표현)
  const spine = vrm.humanoid.getNormalizedBoneNode('spine');
  if (spine) {
    const bounce = Math.sin(time * 12) * 0.05 * intensity;
    spine.rotation.x += bounce;
  }

  // 머리를 크고 활기차게 좌우로 갸우뚱거림
  const head = vrm.humanoid.getNormalizedBoneNode('head');
  if (head) {
    const playMotion = Math.sin(time * 8) * 0.1 * intensity;
    head.rotation.z += playMotion;
  }
};
