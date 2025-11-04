/**
 * Jest Canvas Setup File
 * Configuration for canvas and WebGL mocking in tests
 */

// Mock canvas for chart libraries (MUI X-Charts, ChartJS, etc.)
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.toDataURL = jest.fn();

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      createProgram: jest.fn(),
      createShader: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      useProgram: jest.fn(),
      getUniformLocation: jest.fn(),
      uniform1f: jest.fn(),
      uniform2f: jest.fn(),
      uniform3f: jest.fn(),
      uniform4f: jest.fn(),
      uniformMatrix4fv: jest.fn(),
      vertexAttribPointer: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      createBuffer: jest.fn(),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      drawArrays: jest.fn(),
      clear: jest.fn(),
      clearColor: jest.fn(),
      viewport: jest.fn(),
      getParameter: jest.fn(),
    };
  }
  return {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    strokeRect: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    arc: jest.fn(),
    arcTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    ellipse: jest.fn(),
    rect: jest.fn(),
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    drawImage: jest.fn(),
    createImageData: jest.fn(() => ({ data: new Uint8ClampedArray() })),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray() })),
    putImageData: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createPattern: jest.fn(),
  };
});

// Mock fetch for canvas/WebGL operations
if (!global.fetch) {
  global.fetch = jest.fn();
}
