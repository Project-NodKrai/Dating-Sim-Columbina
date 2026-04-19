import { VRM } from '@pixiv/three-vrm';

/**
 * Updates the VRM blinking expression based on the current time.
 * Creates a smooth 0 -> 1 -> 0 sine-based curve for natural blinking.
 * 
 * @param vrm The VRM instance to update
 * @param time The current clock time in seconds
 * @param shouldBlink Whether the character should be blinking (e.g. disable during 'happy' mood)
 * @param maxBlink The maximum intensity of the blink (default 1.0)
 */
export const updateBlink = (vrm: VRM, time: number, shouldBlink: boolean = true, maxBlink: number = 1.0): void => {
  if (!vrm.expressionManager) return;

  let blinkValue = 0;

  if (shouldBlink) {
    // Blinks every 4 seconds, takes 0.2 seconds to complete
    const blinkPeriod = 4.0;
    const blinkDuration = 0.2;
    const remainder = time % blinkPeriod;

    if (remainder < blinkDuration) {
      // Create a smooth 0 -> maxBlink -> 0 curve using Sine
      blinkValue = Math.sin((remainder / blinkDuration) * Math.PI) * maxBlink;
    }
  }

  vrm.expressionManager.setValue('blink', blinkValue);
};
