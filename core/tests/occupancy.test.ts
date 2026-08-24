import { describe, it, expect } from 'vitest';
import {
  calculateOccupancyStatus,
  DEFAULT_GYM_CAPACITY,
} from '../src/index';

describe('calculateOccupancyStatus', () => {
  it('returns LOW below 40%', () => {
    const result = calculateOccupancyStatus(0, DEFAULT_GYM_CAPACITY);
    expect(result).toEqual({ percentage: 0, status: 'LOW', waitTime: '0–5 min' });
  });

  it('returns LOW just under the 40% threshold', () => {
    // 11/30 = 36.67 -> rounds to 37%
    const result = calculateOccupancyStatus(11, 30);
    expect(result.percentage).toBe(37);
    expect(result.status).toBe('LOW');
    expect(result.waitTime).toBe('0–5 min');
  });

  it('returns MODERATE at exactly 40%', () => {
    // Boundary: 12/30 = exactly 40%, which is NOT < 40
    const result = calculateOccupancyStatus(12, 30);
    expect(result.percentage).toBe(40);
    expect(result.status).toBe('MODERATE');
    expect(result.waitTime).toBe('10 min');
  });

  it('returns MODERATE just under 75%', () => {
    // 22/30 = 73.33 -> 73%
    const result = calculateOccupancyStatus(22, 30);
    expect(result.percentage).toBe(73);
    expect(result.status).toBe('MODERATE');
    expect(result.waitTime).toBe('10 min');
  });

  it('returns HIGH at 75% and above', () => {
    // 23/30 = 76.67 -> 77%
    const high = calculateOccupancyStatus(23, 30);
    expect(high.percentage).toBe(77);
    expect(high.status).toBe('HIGH');
    expect(high.waitTime).toBe('15–25 min');

    const full = calculateOccupancyStatus(30, 30);
    expect(full).toEqual({ percentage: 100, status: 'HIGH', waitTime: '15–25 min' });
  });

  it('clamps negative people counts to zero', () => {
    const result = calculateOccupancyStatus(-5, 30);
    expect(result).toEqual({ percentage: 0, status: 'LOW', waitTime: '0–5 min' });
  });

  it('clamps people counts above capacity to 100%', () => {
    const result = calculateOccupancyStatus(500, 30);
    expect(result).toEqual({ percentage: 100, status: 'HIGH', waitTime: '15–25 min' });
  });

  it.each([
    [undefined, 'undefined'],
    [null, 'null'],
    [0, 'zero'],
    [NaN, 'NaN'],
  ])('falls back to default capacity when capacity is %s', (capacity) => {
    const result = calculateOccupancyStatus(15, capacity as number);
    // 15/30 = 50%
    expect(result.percentage).toBe(50);
    expect(result.status).toBe('MODERATE');
  });

  it('never divides by zero even when fallback is bypassed', () => {
    // Capacity of 1 via Math.max guard
    const result = calculateOccupancyStatus(0, 0.4);
    expect(result.percentage).toBe(0);
    expect(Number.isFinite(result.percentage)).toBe(true);
  });

  it('rounds percentage to nearest integer', () => {
    // 7/30 = 23.33 -> 23
    const result = calculateOccupancyStatus(7, 30);
    expect(result.percentage).toBe(23);
  });

  it('works with small capacities', () => {
    // 3/10 = 30% -> LOW
    const result = calculateOccupancyStatus(3, 10);
    expect(result).toEqual({ percentage: 30, status: 'LOW', waitTime: '0–5 min' });
  });
});
