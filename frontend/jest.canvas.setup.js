/**
 * Jest Canvas and WebGL Mock Setup
 * Sets up Canvas and WebGL mocking for TensorFlow.js testing
 * 
 * @version 1.0
 * @date 2025-01-27
 */

// Import canvas mocks
try {
  require('jest-canvas-mock');
} catch (e) {
  console.warn('jest-canvas-mock not available, using fallback');
}

try {
  require('jest-webgl-canvas-mock');
} catch (e) {
  console.warn('jest-webgl-canvas-mock not available, using fallback');
}

// Mock HTMLCanvasElement for TensorFlow.js
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: {},
        drawingBufferWidth: 1024,
        drawingBufferHeight: 1024,
        getExtension: jest.fn(),
        getParameter: jest.fn(),
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        createFramebuffer: jest.fn(),
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        viewport: jest.fn(),
        clear: jest.fn(),
        drawArrays: jest.fn(),
        readPixels: jest.fn(),
        deleteTexture: jest.fn(),
        deleteBuffer: jest.fn(),
        deleteFramebuffer: jest.fn(),
        deleteProgram: jest.fn(),
        deleteShader: jest.fn(),
        // Additional WebGL methods for TensorFlow.js
        enable: jest.fn(),
        disable: jest.fn(),
        blendFunc: jest.fn(),
        clearColor: jest.fn(),
        clearDepth: jest.fn(),
        depthFunc: jest.fn(),
        frontFace: jest.fn(),
        cullFace: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        disableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        uniform1f: jest.fn(),
        uniform2f: jest.fn(),
        uniform3f: jest.fn(),
        uniform4f: jest.fn(),
        uniform1i: jest.fn(),
        uniform2i: jest.fn(),
        uniform3i: jest.fn(),
        uniform4i: jest.fn(),
        uniformMatrix2fv: jest.fn(),
        uniformMatrix3fv: jest.fn(),
        uniformMatrix4fv: jest.fn(),
        getUniformLocation: jest.fn(),
        getAttribLocation: jest.fn()
      };
    }
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Array(4).fill(0)
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn()
    };
  })
});

// Mock WebGL context creation
global.WebGLRenderingContext = jest.fn();
global.WebGL2RenderingContext = jest.fn();

// Mock performance API for TensorFlow.js
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  };
}

// Mock navigator for device capabilities
Object.defineProperty(global.navigator, 'deviceMemory', {
  value: 8,
  writable: true
});

Object.defineProperty(global.navigator, 'hardwareConcurrency', {
  value: 4,
  writable: true
});

// Mock OffscreenCanvas for TensorFlow.js
global.OffscreenCanvas = jest.fn().mockImplementation(() => ({
  getContext: jest.fn(() => ({
    canvas: {},
    drawingBufferWidth: 1024,
    drawingBufferHeight: 1024
  })),
  width: 1024,
  height: 1024
}));

// Mock ImageData for Canvas operations
global.ImageData = jest.fn().mockImplementation((data, width, height) => ({
  data: data || new Uint8ClampedArray(width * height * 4),
  width: width || 1,
  height: height || 1
}));

// Mock createImageBitmap for advanced Canvas operations
global.createImageBitmap = jest.fn().mockResolvedValue({
  width: 1,
  height: 1,
  close: jest.fn()
});

// Mock fetch for model loading (if not already mocked)
if (!global.fetch) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob())
    })
  );
}

// Mock URL.createObjectURL for blob handling
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
}

if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = jest.fn();
}

// Mock Worker for TensorFlow.js background processing
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock SharedArrayBuffer if not available
if (typeof SharedArrayBuffer === 'undefined') {
  global.SharedArrayBuffer = ArrayBuffer;
}

// Mock WebAssembly for TensorFlow.js WASM backend
if (!global.WebAssembly) {
  global.WebAssembly = {
    instantiate: jest.fn().mockResolvedValue({
      instance: {
        exports: {}
      }
    }),
    compile: jest.fn().mockResolvedValue({}),
    validate: jest.fn().mockReturnValue(true)
  };
}

console.log('✅ Canvas, WebGL, and TensorFlow.js mocks initialized successfully');
