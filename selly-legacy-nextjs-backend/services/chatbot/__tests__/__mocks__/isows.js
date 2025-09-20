// Mock for isows ESM module
module.exports = {
  getNativeWebSocket: () => null,
  WebSocket: class MockWebSocket {
    constructor() {
      this.readyState = 1;
    }
    send() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
};
