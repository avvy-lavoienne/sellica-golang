// Animation utilities for dashboard components
import { Variants } from "framer-motion";

// Stagger animation for dashboard sections
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Fade in up animation for cards
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Scale in animation for stats cards
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// Slide in from left animation
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Slide in from right animation
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Bounce in animation for interactive elements
export const bounceIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      type: "spring",
      bounce: 0.4,
    },
  },
};

// Progress bar animation
export const progressAnimation: Variants = {
  hidden: {
    width: 0,
  },
  visible: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: 1.2,
      ease: "easeOut",
      delay: 0.5,
    },
  }),
};

// Chart animation
export const chartAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.3,
    },
  },
};

// Header animation
export const headerAnimation: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Activity item animation
export const activityItemAnimation: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      delay: index * 0.1,
    },
  }),
  hover: {
    x: 5,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// Button hover animation
export const buttonHover: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeInOut",
    },
  },
};

// Loading pulse animation
export const loadingPulse: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Page transition animation
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Notification animation
export const notificationAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
      type: "spring",
      bounce: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Utility function to create delayed animations
export const createDelayedAnimation = (baseAnimation: Variants, delay: number): Variants => {
  const visible = baseAnimation.visible;
  const visibleTransition = typeof visible === 'object' && visible !== null && 'transition' in visible
    ? (visible as any).transition
    : {};

  return {
    ...baseAnimation,
    visible: {
      ...baseAnimation.visible,
      transition: {
        ...visibleTransition,
        delay,
      },
    },
  };
};

// Utility function for responsive animations
export const createResponsiveAnimation = (
  mobileAnimation: Variants,
  desktopAnimation: Variants,
  breakpoint: number = 768
): Variants => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < breakpoint;
  return isMobile ? mobileAnimation : desktopAnimation;
};
