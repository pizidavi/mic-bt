export const GAIN_MIN_DB = -6;
export const GAIN_MAX_DB = 24;
export const GAIN_STEP_DB = 1;
export const DEFAULT_GAIN_DB = 0;
export const LEVEL_MIN_DB = -60;
export const LEVEL_MAX_DB = 0;

/**
 * Clamp a gain to the supported range in dB
 * @param db Gain in dB
 * @return Clamped gain in dB
 */
export const clampGainDb = (db: number) => Math.min(GAIN_MAX_DB, Math.max(GAIN_MIN_DB, db));

/**
 * Convert dB to a linear gain multiplier
 * @param db Gain in dB
 * @return Linear multiplier
 */
export const dbToLinear = (db: number) => 10 ** (db / 20);

/**
 * Map a dBFS level (-60..0) to a percentage (0..100)
 * @param levelDb Level in dBFS
 * @return Percentage 0..100
 */
export const levelDbToPercent = (levelDb: number) => {
  const clamped = Math.min(LEVEL_MAX_DB, Math.max(LEVEL_MIN_DB, levelDb));
  return Math.round(((clamped - LEVEL_MIN_DB) / (LEVEL_MAX_DB - LEVEL_MIN_DB)) * 100);
};
