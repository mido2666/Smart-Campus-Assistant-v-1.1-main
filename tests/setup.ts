import { vi } from 'vitest';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock media devices API
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 100);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

Object.defineProperty(window, 'WebSocket', {
  writable: true,
  value: MockWebSocket,
});

// Mock Socket.io
Object.defineProperty(window, 'io', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
});

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  writable: true,
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock alert
global.alert = vi.fn();

// Mock confirm
global.confirm = vi.fn();

// Mock prompt
global.prompt = vi.fn();

// Mock Notification
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    close: vi.fn(),
  })),
});

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => {
    return setTimeout(callback, 16);
  }),
});

// Mock cancelAnimationFrame
Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn().mockImplementation((id) => {
    clearTimeout(id);
  }),
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn().mockReturnValue(Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([]),
    getEntriesByName: vi.fn().mockReturnValue([]),
  },
});

// Mock URL API
Object.defineProperty(window, 'URL', {
  writable: true,
  value: vi.fn().mockImplementation((url) => ({
    href: url,
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
  })),
});

// Mock URLSearchParams
Object.defineProperty(window, 'URLSearchParams', {
  writable: true,
  value: vi.fn().mockImplementation((search) => ({
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    toString: vi.fn().mockReturnValue(search || ''),
  })),
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock MutationObserver
Object.defineProperty(window, 'MutationObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([]),
  })),
});

// Mock FileReader
Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    abort: vi.fn(),
    result: null,
    error: null,
    readyState: 0,
    onload: null,
    onerror: null,
    onabort: null,
    onloadend: null,
    onloadstart: null,
    onprogress: null,
  })),
});

// Mock Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
    }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({
      data: new Uint8ClampedArray(4),
    }),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({
      width: 10,
    }),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }),
});

// Mock toDataURL
Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  writable: true,
  value: vi.fn().mockReturnValue('data:image/png;base64,test'),
});

// Mock toBlob
Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
  writable: true,
  value: vi.fn().mockImplementation((callback) => {
    callback(new Blob(['test'], { type: 'image/png' }));
  }),
});

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createAnalyser: vi.fn().mockReturnValue({
      frequencyBinCount: 256,
      getByteFrequencyData: vi.fn(),
    }),
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { value: 1 },
    }),
    destination: {
      connect: vi.fn(),
    },
  })),
});

// Mock WebGL
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn().mockImplementation((contextType) => {
    if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return {
        getParameter: vi.fn().mockReturnValue('WebGL Renderer'),
        getExtension: vi.fn(),
        createShader: vi.fn(),
        createProgram: vi.fn(),
        createBuffer: vi.fn(),
        createTexture: vi.fn(),
        createFramebuffer: vi.fn(),
        createRenderbuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bindTexture: vi.fn(),
        bindFramebuffer: vi.fn(),
        bindRenderbuffer: vi.fn(),
        bufferData: vi.fn(),
        texImage2D: vi.fn(),
        texParameteri: vi.fn(),
        framebufferTexture2D: vi.fn(),
        framebufferRenderbuffer: vi.fn(),
        renderbufferStorage: vi.fn(),
        viewport: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        clearDepth: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        depthFunc: vi.fn(),
        blendFunc: vi.fn(),
        useProgram: vi.fn(),
        uniform1f: vi.fn(),
        uniform1i: vi.fn(),
        uniform2f: vi.fn(),
        uniform3f: vi.fn(),
        uniform4f: vi.fn(),
        uniformMatrix4fv: vi.fn(),
        getUniformLocation: vi.fn(),
        getAttribLocation: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        drawArrays: vi.fn(),
        drawElements: vi.fn(),
        finish: vi.fn(),
        flush: vi.fn(),
        getShaderParameter: vi.fn(),
        getProgramParameter: vi.fn(),
        getShaderInfoLog: vi.fn(),
        getProgramInfoLog: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        validateProgram: vi.fn(),
        getParameter: vi.fn().mockReturnValue('WebGL Renderer'),
      };
    }
    return null;
  }),
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});