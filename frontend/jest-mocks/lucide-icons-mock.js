/**
 * Lucide React Icons Mock
 * 
 * Mocks all lucide-react icon imports for Jest testing
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

// Export all common lucide-react icons
module.exports = {
  Loader: MockIcon,
  Upload: MockIcon,
  Download: MockIcon,
  Trash2: MockIcon,
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
  default: MockIcon,
};

// Default export
module.exports.default = MockIcon;
