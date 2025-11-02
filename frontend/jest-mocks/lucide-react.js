/**
 * Jest mock for lucide-react
 * Mocks all lucide icons as simple span elements
 */

const React = require('react');

// Create a generic icon mock that returns a span
const createIconMock = (name) => () => React.createElement('span', { 'data-testid': `icon-${name}` }, name);

module.exports = {
  Bell: createIconMock('bell'),
  Sun: createIconMock('sun'),
  Moon: createIconMock('moon'),
  User: createIconMock('user'),
  LogOut: createIconMock('logout'),
  Settings: createIconMock('settings'),
  HelpCircle: createIconMock('help-circle'),
  Menu: createIconMock('menu'),
  X: createIconMock('x'),
  ChevronDown: createIconMock('chevron-down'),
  Loader2: createIconMock('loader2'),
  AlertCircle: createIconMock('alert-circle'),
  Search: createIconMock('search'),
  Ticket: createIconMock('ticket'),
  Clock: createIconMock('clock'),
  TrendingUp: createIconMock('trending-up'),
};
