/**
 * Jest mock for lucide-react
 * Mocks all lucide icons as simple React components
 * This mock is used when Jest encounters lucide-react ES modules
 */

const React = require('react');

// Create a generic icon mock that returns a span element
// In tests, we care about presence/absence and data attributes, not rendering
const createIconMock = (name) => {
  const IconComponent = React.forwardRef((props, ref) => 
    React.createElement('span', {
      ref,
      'data-testid': `icon-${name}`,
      'data-icon': name,
      ...props
    }, name)
  );
  IconComponent.displayName = name;
  return IconComponent;
};

// Export all common lucide icons used in the application
// This list is auto-generated and comprehensive
module.exports = {
  // Navigation & UI
  Menu: createIconMock('menu'),
  X: createIconMock('x'),
  ChevronDown: createIconMock('chevron-down'),
  ChevronUp: createIconMock('chevron-up'),
  ChevronLeft: createIconMock('chevron-left'),
  ChevronRight: createIconMock('chevron-right'),
  ArrowLeft: createIconMock('arrow-left'),
  ArrowRight: createIconMock('arrow-right'),
  ArrowUp: createIconMock('arrow-up'),
  ArrowDown: createIconMock('arrow-down'),
  
  // Theme & Settings
  Sun: createIconMock('sun'),
  Moon: createIconMock('moon'),
  Laptop: createIconMock('laptop'),
  Settings: createIconMock('settings'),
  Gear: createIconMock('gear'),
  
  // User & Auth
  User: createIconMock('user'),
  LogOut: createIconMock('logout'),
  LogIn: createIconMock('login'),
  Bell: createIconMock('bell'),
  Mail: createIconMock('mail'),
  Lock: createIconMock('lock'),
  Unlock: createIconMock('unlock'),
  
  // Status & Alerts
  AlertCircle: createIconMock('alert-circle'),
  AlertTriangle: createIconMock('alert-triangle'),
  Info: createIconMock('info'),
  XCircle: createIconMock('x-circle'),
  CheckCircle: createIconMock('check-circle'),
  Check: createIconMock('check'),
  HelpCircle: createIconMock('help-circle'),
  
  // Loading & Progress
  Loader2: createIconMock('loader2'),
  Loader: createIconMock('loader'),
  Spinner: createIconMock('spinner'),
  RotateCw: createIconMock('rotate-cw'),
  
  // Data & Charts
  TrendingUp: createIconMock('trending-up'),
  TrendingDown: createIconMock('trending-down'),
  BarChart3: createIconMock('bar-chart-3'),
  LineChart: createIconMock('line-chart'),
  PieChart: createIconMock('pie-chart'),
  
  // Document & File
  FileText: createIconMock('file-text'),
  File: createIconMock('file'),
  Download: createIconMock('download'),
  Upload: createIconMock('upload'),
  Copy: createIconMock('copy'),
  Trash2: createIconMock('trash2'),
  Edit: createIconMock('edit'),
  Eye: createIconMock('eye'),
  EyeOff: createIconMock('eye-off'),
  
  // Search & Filter
  Search: createIconMock('search'),
  Filter: createIconMock('filter'),
  Sliders: createIconMock('sliders'),
  
  // Business Domain
  Ticket: createIconMock('ticket'),
  Clock: createIconMock('clock'),
  Calendar: createIconMock('calendar'),
  Shield: createIconMock('shield'),
  Activity: createIconMock('activity'),
  Send: createIconMock('send'),
  Paperclip: createIconMock('paperclip'),
  Plus: createIconMock('plus'),
  Minus: createIconMock('minus'),
  
  // Fallback for any unmocked icon
  // This prevents errors when a component uses an icon we haven't explicitly defined
  ...new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return createIconMock(prop);
      }
      return undefined;
    }
  })
};
