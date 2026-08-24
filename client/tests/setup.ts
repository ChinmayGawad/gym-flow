import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MockEventSource, MockBroadcastChannel } from './stubs';

// React Testing Library: unmount components after each test
afterEach(() => {
  cleanup();
  MockEventSource.instances = [];
  MockBroadcastChannel.instances = [];
  window.localStorage.clear();
  document.documentElement.className = '';
});

// jsdom lacks matchMedia; ThemeContext depends on it
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

vi.stubGlobal('EventSource', MockEventSource);
vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
