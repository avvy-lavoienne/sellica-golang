/**
 * Jest Setup File - Global Test Configuration
 */

require('@testing-library/jest-dom');

// ✅ CRITICAL: Mock lucide-react BEFORE any tests run
// Single mocking method: inline jest.mock in setup.js (no moduleNameMapper duplication)
// This must happen in jest.setup.js (setupFilesAfterEnv) to intercept all imports
jest.mock('lucide-react', () => {
  const React = require('react');
  
  // Explicitly defined icons used in the application
  const mockedIcons = {
    Bell: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-bell' }, 'Bell'),
    Sun: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-sun' }, 'Sun'),
    Moon: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-moon' }, 'Moon'),
    Laptop: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-laptop' }, 'Laptop'),
    User: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-user' }, 'User'),
    LogOut: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-logout' }, 'LogOut'),
    Settings: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-settings' }, 'Settings'),
    HelpCircle: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-help' }, 'HelpCircle'),
    Menu: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-menu' }, 'Menu'),
    X: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-x' }, 'X'),
    XCircle: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-x-circle' }, 'XCircle'),
    ChevronDown: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-chevron-down' }, 'ChevronDown'),
    ChevronUp: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-chevron-up' }, 'ChevronUp'),
    ChevronLeft: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-chevron-left' }, 'ChevronLeft'),
    ChevronRight: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-chevron-right' }, 'ChevronRight'),
    ArrowLeft: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-arrow-left' }, 'ArrowLeft'),
    ArrowRight: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-arrow-right' }, 'ArrowRight'),
    ArrowUp: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-arrow-up' }, 'ArrowUp'),
    ArrowDown: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-arrow-down' }, 'ArrowDown'),
    Loader2: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-loader2' }, 'Loader2'),
    Loader: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-loader' }, 'Loader'),
    Spinner: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-spinner' }, 'Spinner'),
    RotateCw: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-rotate-cw' }, 'RotateCw'),
    AlertCircle: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-alert-circle' }, 'AlertCircle'),
    AlertTriangle: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-alert-triangle' }, 'AlertTriangle'),
    Info: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-info' }, 'Info'),
    CheckCircle: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-check-circle' }, 'CheckCircle'),
    Check: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-check' }, 'Check'),
    TrendingUp: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-trending-up' }, 'TrendingUp'),
    TrendingDown: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-trending-down' }, 'TrendingDown'),
    BarChart3: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-bar-chart' }, 'BarChart3'),
    LineChart: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-line-chart' }, 'LineChart'),
    PieChart: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-pie-chart' }, 'PieChart'),
    FileText: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-file-text' }, 'FileText'),
    File: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-file' }, 'File'),
    Download: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-download' }, 'Download'),
    Upload: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-upload' }, 'Upload'),
    Copy: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-copy' }, 'Copy'),
    Trash2: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-trash' }, 'Trash2'),
    Edit: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-edit' }, 'Edit'),
    Eye: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-eye' }, 'Eye'),
    EyeOff: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-eye-off' }, 'EyeOff'),
    Search: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-search' }, 'Search'),
    Filter: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-filter' }, 'Filter'),
    Sliders: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-sliders' }, 'Sliders'),
    Ticket: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-ticket' }, 'Ticket'),
    Clock: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-clock' }, 'Clock'),
    Calendar: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-calendar' }, 'Calendar'),
    Shield: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-shield' }, 'Shield'),
    Activity: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-activity' }, 'Activity'),
    Send: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-send' }, 'Send'),
    Paperclip: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-paperclip' }, 'Paperclip'),
    Plus: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-plus' }, 'Plus'),
    Minus: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-minus' }, 'Minus'),
    UserPlus: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-user-plus' }, 'UserPlus'),
    Save: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-save' }, 'Save'),
    Smartphone: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-smartphone' }, 'Smartphone'),
    MessageSquare: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-message-square' }, 'MessageSquare'),
    Badge: ({ ...props }) => React.createElement('span', { ...props, 'data-testid': 'icon-badge' }, 'Badge'),
  };
  
  // ✅ Catch-all for any unmocked icons: dynamically create a mock on demand
  return new Proxy(mockedIcons, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      // For any icon not explicitly defined, return a dynamic mock
      return ({ ...props }) => React.createElement('span', {
        ...props,
        'data-testid': `icon-${String(prop).toLowerCase()}`,
      }, String(prop));
    },
  });
}, { virtual: true });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};