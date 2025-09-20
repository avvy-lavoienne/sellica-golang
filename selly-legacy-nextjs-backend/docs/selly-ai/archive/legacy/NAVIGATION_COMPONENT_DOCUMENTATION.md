# Navigation Component Documentation

## Overview

The Navigation component is an enterprise-grade navigation system designed for modern web applications. It provides a comprehensive solution for website navigation with advanced features including responsive design, accessibility compliance, theme integration, and smooth animations.

## Features

### ✅ **Core Features**
- **Responsive Design**: Mobile-first approach with optimized breakpoints
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Theme Integration**: Seamless dark/light mode support with smooth transitions
- **Performance Optimized**: Efficient rendering with minimal layout shifts
- **TypeScript Support**: Comprehensive type definitions for better development experience

### ✅ **Advanced Features**
- **Active Section Highlighting**: Automatically highlights current section based on scroll position
- **Smooth Scrolling**: Enhanced scroll behavior for anchor links
- **Mobile Menu**: Sophisticated mobile navigation with animations
- **Nested Menus**: Support for dropdown and nested navigation items
- **Custom Actions**: Configurable action buttons (login, register, etc.)
- **Search Integration**: Optional search functionality
- **Badge Support**: Notification badges and indicators

## Component Architecture

### Main Components

1. **Navigation** - Main navigation container
2. **Logo** - Enhanced logo component with brand integration
3. **ThemeToggle** - Advanced theme switching with multiple variants
4. **NavigationLink** - Individual navigation link with animations
5. **Types** - Comprehensive TypeScript definitions

### File Structure
```
src/components/landing/
├── Navigation.tsx          # Main navigation component
├── Logo.tsx               # Logo component
├── ThemeToggle.tsx        # Theme toggle component
├── NavigationLink.tsx     # Navigation link component
└── types.ts              # TypeScript definitions
```

## API Reference

### Navigation Props

```typescript
interface NavigationProps {
  className?: string
  navigationItems?: NavigationItem[]
  navigationSections?: NavigationSection[]
  logo?: {
    src: string
    alt: string
    href?: string
    width?: number
    height?: number
  }
  brand?: {
    name: string
    href?: string
  }
  actions?: {
    primary?: {
      label: string
      href: string
      variant?: 'default' | 'outline' | 'ghost'
    }
    secondary?: {
      label: string
      href: string
      variant?: 'default' | 'outline' | 'ghost'
    }
  }
  showThemeToggle?: boolean
  showSearch?: boolean
  sticky?: boolean
  transparent?: boolean
  blurBackground?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  onNavigationChange?: (item: NavigationItem) => void
  onMobileMenuToggle?: (isOpen: boolean) => void
}
```

### NavigationItem Interface

```typescript
interface NavigationItem {
  label: string
  href: string
  external?: boolean
  icon?: LucideIcon
  badge?: string | number
  description?: string
  children?: NavigationItem[]
  disabled?: boolean
  highlight?: boolean
  ariaLabel?: string
}
```

## Usage Examples

### Basic Usage

```tsx
import { Navigation } from '@/components/landing/Navigation'

export function App() {
  return (
    <Navigation
      navigationItems={[
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ]}
      brand={{ name: 'Your Brand', href: '/' }}
      showThemeToggle={true}
    />
  )
}
```

### Advanced Usage with Actions

```tsx
<Navigation
  navigationItems={[
    { 
      label: 'Features', 
      href: '#features',
      description: 'Explore our features',
      icon: Star
    },
    { 
      label: 'Pricing', 
      href: '#pricing',
      badge: 'New'
    },
    {
      label: 'Resources',
      href: '#resources',
      children: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api' },
        { label: 'Examples', href: '/examples' },
      ]
    }
  ]}
  brand={{ name: 'SELLICA', href: '/' }}
  actions={{
    secondary: { label: 'Login', href: '/login', variant: 'ghost' },
    primary: { label: 'Get Started', href: '/register', variant: 'default' }
  }}
  showThemeToggle={true}
  showSearch={true}
  sticky={true}
  blurBackground={true}
  maxWidth="xl"
  onNavigationChange={(item) => {
    console.log('Navigation changed:', item)
  }}
  onMobileMenuToggle={(isOpen) => {
    console.log('Mobile menu:', isOpen ? 'opened' : 'closed')
  }}
/>
```

### Custom Logo Configuration

```tsx
<Navigation
  logo={{
    src: '/images/custom-logo.png',
    alt: 'Custom Logo',
    href: '/',
    width: 48,
    height: 48
  }}
  brand={{
    name: 'Custom Brand',
    href: '/'
  }}
  // ... other props
/>
```

## Styling and Customization

### CSS Classes

The Navigation component uses Tailwind CSS classes and can be customized through:

1. **Custom CSS Classes**: Pass `className` prop for additional styling
2. **Tailwind Configuration**: Modify colors, spacing, and typography in `tailwind.config.ts`
3. **CSS Variables**: Use CSS custom properties for theme-aware styling

### Theme Integration

The component automatically adapts to your theme system:

```css
/* Light mode */
.navigation-light {
  --nav-bg: hsl(var(--background));
  --nav-text: hsl(var(--foreground));
}

/* Dark mode */
.navigation-dark {
  --nav-bg: hsl(var(--background));
  --nav-text: hsl(var(--foreground));
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance

- ✅ **Keyboard Navigation**: Full keyboard support with proper tab order
- ✅ **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- ✅ **Focus Management**: Visible focus indicators and proper focus trapping
- ✅ **Color Contrast**: AA compliant contrast ratios for all text
- ✅ **Touch Targets**: Minimum 44px touch targets for mobile devices

### Keyboard Shortcuts

- **Tab**: Navigate through menu items
- **Enter/Space**: Activate menu items
- **Escape**: Close mobile menu
- **Arrow Keys**: Navigate dropdown menus
- **Cmd/Ctrl + L**: Switch to light theme
- **Cmd/Ctrl + D**: Switch to dark theme
- **Cmd/Ctrl + S**: Switch to system theme

## Performance Optimizations

### Rendering Optimizations

- **Throttled Scroll Events**: Optimized scroll handling with requestAnimationFrame
- **Lazy Loading**: Components load only when needed
- **Memoization**: Prevents unnecessary re-renders
- **Efficient State Management**: Minimal state updates

### Bundle Size

- **Tree Shaking**: Only imports used components
- **Code Splitting**: Separate chunks for better loading
- **Optimized Icons**: Efficient icon loading from Lucide React

## Browser Support

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Fallbacks

- **CSS Grid**: Flexbox fallback for older browsers
- **CSS Variables**: Static values for unsupported browsers
- **Modern JavaScript**: Babel transpilation for compatibility

## Testing

### Accessibility Testing

```bash
# Run accessibility tests
npm run test:a11y

# Test with screen readers
npm run test:screen-reader
```

### Unit Tests

```bash
# Run component tests
npm run test:components

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Test mobile navigation
npm run test:mobile
```

## Migration Guide

### From Previous Version

If migrating from the previous Navigation component:

1. **Update Props**: New prop structure with enhanced options
2. **Theme Integration**: New theme system integration
3. **Accessibility**: Enhanced ARIA labels and keyboard navigation
4. **Mobile Menu**: Improved mobile navigation experience

### Breaking Changes

- `navigationItems` prop structure updated
- Theme toggle now separate component
- Mobile menu behavior changed
- CSS classes updated for better consistency

## Troubleshooting

### Common Issues

1. **Theme Toggle Not Working**
   - Ensure ThemeProvider is properly configured
   - Check theme context availability

2. **Mobile Menu Not Closing**
   - Verify click outside detection
   - Check escape key handling

3. **Scroll Highlighting Not Working**
   - Ensure target elements have proper IDs
   - Check intersection observer support

### Debug Mode

Enable debug mode for development:

```tsx
<Navigation
  // ... other props
  debug={process.env.NODE_ENV === 'development'}
/>
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
```

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Accessibility**: WCAG 2.1 AA compliance required

## Changelog

### v2.0.0 (Current)
- ✅ Complete redesign with enterprise-grade features
- ✅ Enhanced accessibility compliance
- ✅ Improved mobile navigation experience
- ✅ Advanced theme integration
- ✅ Performance optimizations

### v1.0.0 (Previous)
- Basic navigation functionality
- Simple mobile menu
- Basic theme support

---

**Navigation Component** - Enterprise-grade navigation for modern web applications.

Built with ❤️ using React, TypeScript, and Tailwind CSS.
