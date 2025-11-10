/**
 * Lucide React Package Mock
 * 
 * Mocks the lucide-react package entirely for Jest testing
 * Prevents "Cannot use import statement outside a module" errors
 */

const React = require('react');

// Mock component that returns a simple div representing an icon
const MockIcon = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    ref,
    'data-testid': 'lucide-icon',
    className: props.className,
    style: { display: 'inline-block', width: '1em', height: '1em' },
    ...props,
  });
});

MockIcon.displayName = 'LucideIcon';

// Export all common lucide-react icons used in the application
const icons = {
  Loader: MockIcon,
  Upload: MockIcon,
  Download: MockIcon,
  Trash2: MockIcon,
  Trash: MockIcon,
  Edit: MockIcon,
  Save: MockIcon,
  X: MockIcon,
  Check: MockIcon,
  AlertCircle: MockIcon,
  Info: MockIcon,
  Warning: MockIcon,
  CheckCircle: MockIcon,
  XCircle: MockIcon,
  Eye: MockIcon,
  EyeOff: MockIcon,
  Home: MockIcon,
  Settings: MockIcon,
  User: MockIcon,
  LogOut: MockIcon,
  Menu: MockIcon,
  Close: MockIcon,
  Plus: MockIcon,
  Minus: MockIcon,
  Copy: MockIcon,
  Share: MockIcon,
  Search: MockIcon,
  Filter: MockIcon,
  Sort: MockIcon,
  ChevronDown: MockIcon,
  ChevronUp: MockIcon,
  ChevronLeft: MockIcon,
  ChevronRight: MockIcon,
  ArrowDown: MockIcon,
  ArrowUp: MockIcon,
  ArrowLeft: MockIcon,
  ArrowRight: MockIcon,
  MoreHorizontal: MockIcon,
  MoreVertical: MockIcon,
  Calendar: MockIcon,
  Clock: MockIcon,
  Mail: MockIcon,
  Phone: MockIcon,
};

// Export as module
module.exports = icons;
module.exports.default = icons;

// Make all icons individually available
Object.keys(icons).forEach((key) => {
  module.exports[key] = icons[key];
});
