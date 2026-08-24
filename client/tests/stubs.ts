import { vi } from 'vitest';

export interface MockEventSourceInstance {
  url: string;
  withCredentials: boolean;
  onopen: ((ev?: unknown) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: ((ev?: unknown) => void) | null;
  closed: boolean;
  close: () => void;
}

export class MockEventSource implements MockEventSourceInstance {
  static instances: MockEventSource[] = [];

  url: string;
  withCredentials: boolean;
  onopen: ((ev?: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev?: unknown) => void) | null = null;
  closed = false;

  constructor(url: string | URL, options?: { withCredentials?: boolean }) {
    this.url = String(url);
    this.withCredentials = options?.withCredentials ?? false;
    MockEventSource.instances.push(this);
  }

  open() {
    this.onopen?.({});
  }

  emit(data: unknown) {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }

  error() {
    this.onerror?.({});
  }

  close() {
    this.closed = true;
  }
}

export interface MockBroadcastChannelInstance {
  name: string;
  onmessage: ((ev: { data: unknown }) => void) | null;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

export class MockBroadcastChannel implements MockBroadcastChannelInstance {
  static instances: MockBroadcastChannel[] = [];

  name: string;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;

  constructor(name: string) {
    this.name = name;
    this.postMessage = vi.fn((data: unknown) => {
      // Deliver synchronously to other channels with the same name (cross-tab simulation)
      for (const ch of MockBroadcastChannel.instances) {
        if (ch !== this && ch.name === name && ch.onmessage) {
          ch.onmessage({ data });
        }
      }
    });
    this.close = vi.fn();
    MockBroadcastChannel.instances.push(this);
  }

  /** Simulate another tab broadcasting to this channel */
  receive(data: unknown) {
    this.onmessage?.({ data });
  }
}
