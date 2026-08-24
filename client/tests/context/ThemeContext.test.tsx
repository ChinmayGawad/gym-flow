import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

const matchMediaMock = window.matchMedia as ReturnType<typeof vi.fn>;

function makeMql(matches: boolean) {
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('ThemeProvider / useTheme', () => {
  beforeEach(() => {
    matchMediaMock.mockImplementation(() => makeMql(false));
  });

  it('defaults to the system theme resolved as light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('resolves system theme to dark when the media query matches', () => {
    matchMediaMock.mockImplementation(() => makeMql(true));

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('toggleTheme flips to dark, persists and applies the root class', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => result.current.toggleTheme());

    await waitFor(() => expect(result.current.resolvedTheme).toBe('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(window.localStorage.getItem('gymflow_theme')).toBe('dark');
  });

  it('toggling twice returns to light and removes the root class', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => result.current.toggleTheme());
    await waitFor(() => expect(result.current.resolvedTheme).toBe('dark'));
    act(() => result.current.toggleTheme());

    await waitFor(() => expect(result.current.resolvedTheme).toBe('light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('honours a persisted theme on mount', () => {
    window.localStorage.setItem('gymflow_theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('ignores corrupted stored values and falls back to default', () => {
    window.localStorage.setItem('gymflow_theme', 'midnight');

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    expect(result.current.theme).toBe('system');
  });

  it('reacts to OS scheme changes while in system mode', async () => {
    let changeListener: ((e: { matches: boolean }) => void) | undefined;
    matchMediaMock.mockImplementation(() => {
      const mql = makeMql(false);
      mql.addEventListener = (_type: string, cb: (e: { matches: boolean }) => void) => {
        changeListener = cb;
      };
      return mql;
    });

    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(result.current.theme).toBe('system');

    // OS switches to dark mode
    act(() => changeListener?.({ matches: true }));

    await waitFor(() => expect(result.current.resolvedTheme).toBe('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setTheme pins an explicit theme that no longer follows the OS', async () => {
    matchMediaMock.mockImplementation(() => makeMql(false));
    const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });

    act(() => result.current.setTheme('dark'));

    expect(result.current.theme).toBe('dark');
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    );
    expect(window.localStorage.getItem('gymflow_theme')).toBe('dark');
  });

  it('throws when used outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });
});
