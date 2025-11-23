/**
 * Jest setup file for lucide-react mocking
 * This runs BEFORE the test environment is set up
 */

// Mock lucide-react globally before any test files are loaded
jest.mock('lucide-react', () => {
  const React = require('react');

  // Create a generic icon mock that returns a span element
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

  // Return all the icons used in the SearchBar component
  return {
    Search: createIconMock('search'),
    X: createIconMock('x'),
    AlertCircle: createIconMock('alert-circle'),
    FileText: createIconMock('file-text'),
    // Add more icons as needed
    ...new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return createIconMock(prop);
        }
        return undefined;
      }
    })
  };
});