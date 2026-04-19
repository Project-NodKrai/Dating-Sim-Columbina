import { VRM } from '@pixiv/three-vrm';
import { Mood } from '../../types';

/**
 * Updates the VRM face expressions based on the current mood.
 * Categorizes and applies various facial keys to match the character's emotional state.
 * 
 * @param vrm The VRM instance to update
 * @param mood The current mood state
 */
export const updateMoodExpression = (vrm: VRM, mood: Mood): void => {
  if (!vrm.expressionManager) return;

  const expressions = vrm.expressionManager;

  // Common mood-related expression keys
  const managedKeys = ['happy', 'sad', 'angry', 'relaxed', 'surprised'];

  // Reset managed expressions to 0
  managedKeys.forEach(key => expressions.setValue(key, 0));

  // Layer the correct expression based on mood
  switch (mood) {
    case 'happy':
      expressions.setValue('happy', 1.0);
      break;
    case 'excited':
      // 신났을 때는 입을 더 크게 벌리거나(happy) 기본 기쁨을 유지합니다.
      expressions.setValue('happy', 1.0);
      break;
    case 'sad':
      expressions.setValue('sad', 1.0);
      break;
    case 'angry':
      // 눈매는 그대로 유지하면서 입꼬리만 확실히 내리기 위해 sad 비율을 0.5로 설정합니다.
      // 눈매가 무너지는 임계점 직전까지 입술 근육을 당겨 :< 모양을 만듭니다.
      expressions.setValue('angry', 1.0);
      expressions.setValue('sad', 0.5);
      break;
    case 'tired':
      // 'tired' typically uses 'relaxed' but can also have a bit of 'sad'
      expressions.setValue('relaxed', 0.6);
      break;
    case 'neutral':
    default:
      // 기존의 relaxed(0.1)가 입꼬리를 아주 살짝 올리고 있었으므로, 
      // 이를 제거하여 더 차분하고 평평한(또는 살짝 내려간) 입매를 만듭니다.
      expressions.setValue('relaxed', 0);
      break;
  }
};
