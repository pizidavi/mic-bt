import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GAIN_DB,
  GAIN_MAX_DB,
  GAIN_MIN_DB,
  clampGainDb,
  dbToLinear,
  levelDbToPercent,
} from './audio';

describe('audio', () => {
  it('keeps gains inside the supported range', () => {
    expect(clampGainDb(GAIN_MIN_DB)).toBe(-6);
    expect(clampGainDb(GAIN_MAX_DB)).toBe(24);
    expect(clampGainDb(DEFAULT_GAIN_DB)).toBe(0);
    expect(clampGainDb(-100)).toBe(-6);
    expect(clampGainDb(100)).toBe(24);
  });

  it('converts dB to a linear multiplier', () => {
    expect(dbToLinear(0)).toBeCloseTo(1);
    expect(dbToLinear(6)).toBeCloseTo(1.9953, 4);
    expect(dbToLinear(-6)).toBeCloseTo(0.5012, 4);
    expect(dbToLinear(24)).toBeCloseTo(15.8489, 4);
  });

  it('maps dBFS levels to percentages', () => {
    expect(levelDbToPercent(-60)).toBe(0);
    expect(levelDbToPercent(0)).toBe(100);
    expect(levelDbToPercent(-30)).toBe(50);
    expect(levelDbToPercent(-45)).toBe(25);
    expect(levelDbToPercent(-15)).toBe(75);
  });

  it('clamps dBFS levels outside the meter range', () => {
    expect(levelDbToPercent(-120)).toBe(0);
    expect(levelDbToPercent(10)).toBe(100);
    expect(levelDbToPercent(-59.9)).toBe(0);
  });

  it('rounds percentages to integers', () => {
    expect(levelDbToPercent(-30.05)).toBe(50);
    expect(levelDbToPercent(-10.1)).toBe(83);
  });
});
