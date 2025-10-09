import type { Config } from "tailwindcss"

const config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,mdx}",
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
    "*.{js,jsx,ts,tsx,mdx}",
    // Flowbite React component paths
    "./node_modules/flowbite-react/lib/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: ["class"],
  // Optimize for production builds
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    // Enhanced container configuration for better responsive design
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      // Enhanced responsive breakpoints for modern devices
      screens: {
        xs: "475px", // Extra small devices
        sm: "640px", // Small devices (default)
        md: "768px", // Medium devices (default)
        lg: "1024px", // Large devices (default)
        xl: "1280px", // Extra large devices (default)
        "2xl": "1536px", // 2X large devices (default)
        "3xl": "1920px", // Ultra wide screens
        "4xl": "2560px", // 4K screens
        // Custom breakpoints for specific use cases
        mobile: "640px",
        tablet: "768px",
        laptop: "1024px",
        desktop: "1280px",
        wide: "1536px",
        // Height-based breakpoints for better mobile experience
        "h-sm": { raw: "(min-height: 640px)" },
        "h-md": { raw: "(min-height: 768px)" },
        "h-lg": { raw: "(min-height: 1024px)" },
      },
      colors: {
        current: "currentColor",
        transparent: "transparent",
        white: "#FFFFFF",
        black: "#000000",

        // Core semantic colors using CSS variables for theme support
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Primary brand colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50, 240 100% 98%))",
          100: "hsl(var(--primary-100, 240 100% 95%))",
          200: "hsl(var(--primary-200, 240 96% 89%))",
          300: "hsl(var(--primary-300, 240 91% 80%))",
          400: "hsl(var(--primary-400, 240 84% 69%))",
          500: "hsl(var(--primary-500, 240 79% 58%))",
          600: "hsl(var(--primary-600, 240 75% 47%))",
          700: "hsl(var(--primary-700, 240 69% 38%))",
          800: "hsl(var(--primary-800, 240 64% 30%))",
          900: "hsl(var(--primary-900, 240 61% 24%))",
          950: "hsl(var(--primary-950, 240 58% 15%))",
        },

        // Secondary colors
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "hsl(var(--secondary-50, 210 40% 98%))",
          100: "hsl(var(--secondary-100, 210 40% 96%))",
          200: "hsl(var(--secondary-200, 214 32% 91%))",
          300: "hsl(var(--secondary-300, 213 27% 84%))",
          400: "hsl(var(--secondary-400, 215 20% 65%))",
          500: "hsl(var(--secondary-500, 215 16% 47%))",
          600: "hsl(var(--secondary-600, 215 19% 35%))",
          700: "hsl(var(--secondary-700, 215 25% 27%))",
          800: "hsl(var(--secondary-800, 217 33% 17%))",
          900: "hsl(var(--secondary-900, 222 47% 11%))",
          950: "hsl(var(--secondary-950, 222 84% 5%))",
        },

        // Status colors with proper semantic naming
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          50: "hsl(var(--destructive-50, 0 86% 97%))",
          100: "hsl(var(--destructive-100, 0 93% 94%))",
          200: "hsl(var(--destructive-200, 0 96% 89%))",
          300: "hsl(var(--destructive-300, 0 94% 82%))",
          400: "hsl(var(--destructive-400, 0 91% 71%))",
          500: "hsl(var(--destructive-500, 0 84% 60%))",
          600: "hsl(var(--destructive-600, 0 72% 51%))",
          700: "hsl(var(--destructive-700, 0 74% 42%))",
          800: "hsl(var(--destructive-800, 0 70% 35%))",
          900: "hsl(var(--destructive-900, 0 63% 31%))",
          950: "hsl(var(--destructive-950, 0 75% 15%))",
        },

        success: {
          DEFAULT: "hsl(var(--success, 142 76% 36%))",
          foreground: "hsl(var(--success-foreground, 138 76% 97%))",
          50: "hsl(var(--success-50, 138 76% 97%))",
          100: "hsl(var(--success-100, 141 84% 93%))",
          200: "hsl(var(--success-200, 141 79% 85%))",
          300: "hsl(var(--success-300, 142 77% 73%))",
          400: "hsl(var(--success-400, 142 69% 58%))",
          500: "hsl(var(--success-500, 142 76% 36%))",
          600: "hsl(var(--success-600, 142 72% 29%))",
          700: "hsl(var(--success-700, 142 70% 24%))",
          800: "hsl(var(--success-800, 142 64% 20%))",
          900: "hsl(var(--success-900, 143 61% 17%))",
          950: "hsl(var(--success-950, 144 60% 9%))",
        },

        warning: {
          DEFAULT: "hsl(var(--warning, 38 92% 50%))",
          foreground: "hsl(var(--warning-foreground, 48 96% 89%))",
          50: "hsl(var(--warning-50, 48 100% 96%))",
          100: "hsl(var(--warning-100, 48 96% 89%))",
          200: "hsl(var(--warning-200, 48 97% 77%))",
          300: "hsl(var(--warning-300, 46 97% 65%))",
          400: "hsl(var(--warning-400, 43 96% 56%))",
          500: "hsl(var(--warning-500, 38 92% 50%))",
          600: "hsl(var(--warning-600, 32 95% 44%))",
          700: "hsl(var(--warning-700, 26 90% 37%))",
          800: "hsl(var(--warning-800, 23 83% 31%))",
          900: "hsl(var(--warning-900, 22 78% 26%))",
          950: "hsl(var(--warning-950, 21 92% 14%))",
        },

        info: {
          DEFAULT: "hsl(var(--info, 199 89% 48%))",
          foreground: "hsl(var(--info-foreground, 198 100% 96%))",
          50: "hsl(var(--info-50, 198 100% 96%))",
          100: "hsl(var(--info-100, 199 100% 92%))",
          200: "hsl(var(--info-200, 199 100% 84%))",
          300: "hsl(var(--info-300, 199 95% 74%))",
          400: "hsl(var(--info-400, 199 89% 61%))",
          500: "hsl(var(--info-500, 199 89% 48%))",
          600: "hsl(var(--info-600, 200 98% 39%))",
          700: "hsl(var(--info-700, 201 96% 32%))",
          800: "hsl(var(--info-800, 201 90% 27%))",
          900: "hsl(var(--info-900, 202 80% 24%))",
          950: "hsl(var(--info-950, 202 80% 16%))",
        },

        // UI element colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Legacy color system (keeping for backward compatibility)
        stroke: "#E6EBF1",
        "stroke-dark": "#27303E",
        dark: {
          DEFAULT: "#111928",
          2: "#1F2A37",
          3: "#374151",
          4: "#4B5563",
          5: "#6B7280",
          6: "#9CA3AF",
          7: "#D1D5DB",
          8: "#E5E7EB",
        },
        gray: {
          DEFAULT: "#EFF4FB",
          dark: "#122031",
          1: "#F9FAFB",
          2: "#F3F4F6",
          3: "#E5E7EB",
          4: "#D1D5DB",
          5: "#9CA3AF",
          6: "#6B7280",
          7: "#374151",
        },
        green: {
          DEFAULT: "#22AD5C",
          dark: "#1A8245",
          light: {
            DEFAULT: "#2CD673",
            1: "#10B981",
            2: "#57DE8F",
            3: "#82E6AC",
            4: "#ACEFC8",
            5: "#C2F3D6",
            6: "#DAF8E6",
            7: "#E9FBF0",
          },
        },
        red: {
          DEFAULT: "#F23030",
          dark: "#E10E0E",
          light: {
            DEFAULT: "#F56060",
            2: "#F89090",
            3: "#FBC0C0",
            4: "#FDD8D8",
            5: "#FEEBEB",
            6: "#FEF3F3",
          },
        },
        blue: {
          DEFAULT: "#3C50E0",
          dark: "#1C3FB7",
          light: {
            DEFAULT: "#5475E5",
            2: "#8099EC",
            3: "#ADBCF2",
            4: "#C3CEF6",
            5: "#E1E8FF",
          },
        },
        orange: {
          light: {
            DEFAULT: "#F59460",
          },
        },
        yellow: {
          dark: {
            DEFAULT: "#F59E0B",
            2: "#D97706",
          },
          light: {
            DEFAULT: "#FCD34D",
            4: "#FFFBEB",
          },
        },
      },
      fontSize: {
        // Enhanced typography scale with fluid sizing
        "display-2xl": [
          "clamp(3.5rem, 5vw, 4.5rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "display-xl": [
          "clamp(3rem, 4vw, 3.75rem)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "display-lg": [
          "clamp(2.5rem, 3.5vw, 3rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-md": [
          "clamp(2rem, 3vw, 2.25rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-sm": [
          "clamp(1.75rem, 2.5vw, 1.875rem)",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],

        // Heading scale with improved readability
        "heading-1": [
          "clamp(2.5rem, 4vw, 3.75rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "heading-2": [
          "clamp(2rem, 3vw, 3rem)",
          { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "heading-3": [
          "clamp(1.75rem, 2.5vw, 2.25rem)",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "heading-4": [
          "clamp(1.5rem, 2vw, 1.875rem)",
          { lineHeight: "1.35", letterSpacing: "-0.005em", fontWeight: "600" },
        ],
        "heading-5": [
          "clamp(1.25rem, 1.5vw, 1.5rem)",
          { lineHeight: "1.4", fontWeight: "500" },
        ],
        "heading-6": [
          "clamp(1.125rem, 1.25vw, 1.25rem)",
          { lineHeight: "1.45", fontWeight: "500" },
        ],

        // Body text with optimal reading experience
        "body-2xl": ["1.5rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-xl": ["1.25rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-lg": ["1.125rem", { lineHeight: "1.65", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.65", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.7", fontWeight: "400" }],
        "body-xs": ["0.75rem", { lineHeight: "1.75", fontWeight: "400" }],

        // UI text sizes
        "ui-xl": ["1.125rem", { lineHeight: "1.5", fontWeight: "500" }],
        "ui-lg": ["1rem", { lineHeight: "1.5", fontWeight: "500" }],
        "ui-md": ["0.875rem", { lineHeight: "1.5", fontWeight: "500" }],
        "ui-sm": ["0.75rem", { lineHeight: "1.5", fontWeight: "500" }],
        "ui-xs": ["0.6875rem", { lineHeight: "1.5", fontWeight: "500" }],

        // Caption and label text
        caption: [
          "0.75rem",
          { lineHeight: "1.5", fontWeight: "400", letterSpacing: "0.025em" },
        ],
        overline: [
          "0.6875rem",
          {
            lineHeight: "1.5",
            fontWeight: "600",
            letterSpacing: "0.1em",
          },
        ],

        // Legacy sizes (for backward compatibility)
        "body-2xlg": ["1.375rem", { lineHeight: "1.6" }],
      },
      spacing: {
        // Enhanced spacing scale with logical progression
        // Fine-grained spacing for precise layouts
        0.25: "0.0625rem", // 1px
        0.75: "0.1875rem", // 3px
        1.25: "0.3125rem", // 5px
        1.75: "0.4375rem", // 7px
        2.25: "0.5625rem", // 9px
        2.75: "0.6875rem", // 11px
        3.25: "0.8125rem", // 13px
        3.75: "0.9375rem", // 15px

        // Standard spacing with half-step increments
        4.5: "1.125rem", // 18px
        5.5: "1.375rem", // 22px
        6.5: "1.625rem", // 26px
        7.5: "1.875rem", // 30px
        8.5: "2.125rem", // 34px
        9.5: "2.375rem", // 38px
        10.5: "2.625rem", // 42px
        11.5: "2.875rem", // 46px
        12.5: "3.125rem", // 50px
        13.5: "3.375rem", // 54px
        14.5: "3.625rem", // 58px
        15.5: "3.875rem", // 62px

        // Larger spacing for layouts
        18: "4.5rem", // 72px
        20: "5rem", // 80px
        22: "5.5rem", // 88px
        24: "6rem", // 96px
        28: "7rem", // 112px
        32: "8rem", // 128px
        36: "9rem", // 144px
        40: "10rem", // 160px
        44: "11rem", // 176px
        48: "12rem", // 192px
        52: "13rem", // 208px
        56: "14rem", // 224px
        60: "15rem", // 240px
        64: "16rem", // 256px
        72: "18rem", // 288px
        80: "20rem", // 320px
        96: "24rem", // 384px

        // Extra large spacing for major layout sections
        112: "28rem", // 448px
        128: "32rem", // 512px
        144: "36rem", // 576px
        160: "40rem", // 640px
        176: "44rem", // 704px
        192: "48rem", // 768px
        208: "52rem", // 832px
        224: "56rem", // 896px
        240: "60rem", // 960px
        256: "64rem", // 1024px
        288: "72rem", // 1152px
        320: "80rem", // 1280px
        384: "96rem", // 1536px

        // Legacy spacing (for backward compatibility)
        11: "2.75rem",
        13: "3.25rem",
        14: "3.5rem",
        15: "3.75rem",
        16: "4rem",
        17: "4.25rem",
        19: "4.75rem",
        21: "5.25rem",
        25: "6.25rem",
        26: "6.5rem",
        27: "6.75rem",
        29: "7.25rem",
        30: "7.5rem",
        31: "7.75rem",
        33: "8.25rem",
        34: "8.5rem",
        35: "8.75rem",
        37.5: "9.375rem",
        39: "9.75rem",
        42.5: "10.625rem",
        45: "11.25rem",
        46: "11.5rem",
        49: "12.25rem",
        50: "12.5rem",
        54: "13.5rem",
        55: "13.75rem",
        59: "14.75rem",
        62.5: "15.625rem",
        65: "16.25rem",
        67: "16.75rem",
        70: "17.5rem",
        73: "18.25rem",
        75: "18.75rem",
        90: "22.5rem",
        94: "23.5rem",
        95: "23.75rem",
        100: "25rem",
        103: "25.75rem",
        115: "28.75rem",
        125: "31.25rem",
        132.5: "33.125rem",
        150: "37.5rem",
        171.5: "42.875rem",
        180: "45rem",
        187.5: "46.875rem",
        203: "50.75rem",
        230: "57.5rem",
        242.5: "60.625rem",
      },
      maxWidth: {
        2.5: "0.625rem",
        3: "0.75rem",
        4: "1rem",
        7: "1.75rem",
        9: "2.25rem",
        10: "2.5rem",
        10.5: "2.625rem",
        11: "2.75rem",
        13: "3.25rem",
        14: "3.5rem",
        15: "3.75rem",
        16: "4rem",
        22.5: "5.625rem",
        25: "6.25rem",
        30: "7.5rem",
        34: "8.5rem",
        35: "8.75rem",
        40: "10rem",
        42.5: "10.625rem",
        44: "11rem",
        45: "11.25rem",
        46.5: "11.625rem",
        60: "15rem",
        70: "17.5rem",
        90: "22.5rem",
        94: "23.5rem",
        100: "25rem",
        103: "25.75rem",
        125: "31.25rem",
        132.5: "33.125rem",
        142.5: "35.625rem",
        150: "37.5rem",
        180: "45rem",
        203: "50.75rem",
        230: "57.5rem",
        242.5: "60.625rem",
        270: "67.5rem",
        280: "70rem",
        292.5: "73.125rem",
      },
      maxHeight: {
        35: "8.75rem",
        70: "17.5rem",
        90: "22.5rem",
        550: "34.375rem",
        300: "18.75rem",
      },
      minWidth: {
        22.5: "5.625rem",
        42.5: "10.625rem",
        47.5: "11.875rem",
        75: "18.75rem",
      },
      zIndex: {
        999999: "999999",
        99999: "99999",
        9999: "9999",
        999: "999",
        99: "99",
        9: "9",
        1: "1",
      },
      opacity: {
        65: ".65",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "21/9": "21 / 9",
      },
      backgroundImage: {
        video: "url('../images/video/video.png')",
      },
      content: {
        "icon-copy": 'url("../images/icon/icon-copy-alt.svg")',
      },
      transitionProperty: {
        width: "width",
        height: "height",
        stroke: "stroke",
        all: "all",
        colors: "background-color, border-color, color, fill, stroke",
        opacity: "opacity",
        shadow: "box-shadow",
        transform: "transform",
        filter: "filter",
        backdrop: "backdrop-filter",
        spacing: "margin, padding",
        size: "width, height",
        position: "top, right, bottom, left",
      },
      transitionTimingFunction: {
        "ease-spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "ease-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-swift": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-gentle": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "ease-emphasized": "cubic-bezier(0.2, 0, 0, 1)",
        "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "ease-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
        "ease-accelerate": "cubic-bezier(0.4, 0, 1, 1)",
      },
      transitionDuration: {
        "50": "50ms",
        "100": "100ms",
        "200": "200ms",
        "250": "250ms",
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "900": "900ms",
        "1200": "1200ms",
        "1500": "1500ms",
      },
      borderWidth: {
        6: "6px",
        10: "10px",
        12: "12px",
      },
      boxShadow: {
        default: "0px 4px 7px 0px rgba(0, 0, 0, 0.14)",
        error: "0px 12px 34px 0px rgba(13, 10, 44, 0.05)",
        card: "0px 1px 2px 0px rgba(0, 0, 0, 0.12)",
        "card-2": "0px 8px 13px -3px rgba(0, 0, 0, 0.07)",
        "card-3": "0px 2px 3px 0px rgba(183, 183, 183, 0.50)",
        "card-4": "0px 1px 3px 0px rgba(0, 0, 0, 0.12)",
        "card-5": "0px 1px 3px 0px rgba(0, 0, 0, 0.13)",
        "card-6": "0px 3px 8px 0px rgba(0, 0, 0, 0.08)",
        "card-7": "0px 0.5px 3px 0px rgba(0, 0, 0, 0.18)",
        "card-8": "0px 1px 2px 0px rgba(0, 0, 0, 0.10)",
        "card-9": "0px 1px 3px 0px rgba(0, 0, 0, 0.08)",
        "card-10": "0px 2px 3px 0px rgba(0, 0, 0, 0.10)",
        switcher:
          "0px 2px 4px rgba(0, 0, 0, 0.2), inset 0px 2px 2px #FFFFFF, inset 0px -1px 1px rgba(0, 0, 0, 0.1)",
        "switch-1": "0px 0px 4px 0px rgba(0, 0, 0, 0.10)",
        "switch-2": "0px 0px 5px 0px rgba(0, 0, 0, 0.15)",
        datepicker: "-5px 0 0 #1f2a37, 5px 0 0 #1f2a37",
        1: "0px 1px 2px 0px rgba(84, 87, 118, 0.12)",
        2: "0px 2px 3px 0px rgba(84, 87, 118, 0.15)",
        3: "0px 8px 8.466px 0px rgba(113, 116, 152, 0.05), 0px 8px 16.224px 0px rgba(113, 116, 152, 0.07), 0px 18px 31px 0px rgba(113, 116, 152, 0.10)",
        4: "0px 13px 40px 0px rgba(13, 10, 44, 0.22), 0px -8px 18px 0px rgba(13, 10, 44, 0.04)",
        5: "0px 10px 30px 0px rgba(85, 106, 235, 0.12), 0px 4px 10px 0px rgba(85, 106, 235, 0.04), 0px -18px 38px 0px rgba(85, 106, 235, 0.04)",
        6: "0px 12px 34px 0px rgba(13, 10, 44, 0.08), 0px 34px 26px 0px rgba(13, 10, 44, 0.05)",
        7: "0px 18px 25px 0px rgba(113, 116, 152, 0.05)",
        // New enhanced shadows
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        elevated:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        floating:
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
      dropShadow: {
        card: "0px 8px 13px rgba(0, 0, 0, 0.07)",
        1: "0px 1px 0px #E2E8F0",
        2: "0px 1px 4px rgba(0, 0, 0, 0.12)",
        3: "0px 0px 4px rgba(0, 0, 0, 0.15)",
        4: "0px 0px 2px rgba(0, 0, 0, 0.2)",
        5: "0px 1px 5px rgba(0, 0, 0, 0.2)",
      },
      keyframes: {
        linspin: {
          "100%": { transform: "rotate(360deg)" },
        },
        easespin: {
          "12.5%": { transform: "rotate(135deg)" },
          "25%": { transform: "rotate(270deg)" },
          "37.5%": { transform: "rotate(405deg)" },
          "50%": { transform: "rotate(540deg)" },
          "62.5%": { transform: "rotate(675deg)" },
          "75%": { transform: "rotate(810deg)" },
          "87.5%": { transform: "rotate(945deg)" },
          "100%": { transform: "rotate(1080deg)" },
        },
        "left-spin": {
          "0%": { transform: "rotate(130deg)" },
          "50%": { transform: "rotate(-5deg)" },
          "100%": { transform: "rotate(130deg)" },
        },
        "right-spin": {
          "0%": { transform: "rotate(-130deg)" },
          "50%": { transform: "rotate(5deg)" },
          "100%": { transform: "rotate(-130deg)" },
        },
        rotating: {
          "0%, 100%": { transform: "rotate(360deg)" },
          "50%": { transform: "rotate(0deg)" },
        },
        topbottom: {
          "0%, 100%": { transform: "translate3d(0, -100%, 0)" },
          "50%": { transform: "translate3d(0, 0, 0)" },
        },
        bottomtop: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -100%, 0)" },
        },
        line: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(100%)" },
        },
        "line-revert": {
          "0%, 100%": { transform: "translateY(100%)" },
          "50%": { transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Enhanced animations with better easing and micro-interactions
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "slide-out-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "zoom-out": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.8)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "pulse-strong": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        heartbeat: {
          "0%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.1)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "loading-dots": {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        "skeleton-wave": {
          "0%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        linspin: "linspin 1568.2353ms linear infinite",
        easespin: "easespin 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both",
        "left-spin":
          "left-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both",
        "right-spin":
          "right-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both",
        "ping-once": "ping 5s cubic-bezier(0, 0, 0.2, 1)",
        rotating: "rotating 30s linear infinite",
        topbottom: "topbottom 60s infinite alternate linear",
        bottomtop: "bottomtop 60s infinite alternate linear",
        "spin-1.5": "spin 1.5s linear infinite",
        "spin-2": "spin 2s linear infinite",
        "spin-3": "spin 3s linear infinite",
        line1: "line 10s infinite linear",
        line2: "line-revert 8s infinite linear",
        line3: "line 7s infinite linear",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Enhanced animations with improved easing curves
        "fade-in": "fade-in 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fade-out 200ms cubic-bezier(0.4, 0, 1, 1)",
        "fade-in-up": "fade-in-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-down": "fade-in-down 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slide-in-left 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-left": "slide-out-left 200ms cubic-bezier(0.4, 0, 1, 1)",
        "slide-out-right": "slide-out-right 200ms cubic-bezier(0.4, 0, 1, 1)",
        "slide-up": "slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slide-down 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-out": "scale-out 150ms cubic-bezier(0.4, 0, 1, 1)",
        "zoom-in": "zoom-in 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-out": "zoom-out 200ms cubic-bezier(0.4, 0, 1, 1)",
        "bounce-in": "bounce-in 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        shake: "shake 500ms cubic-bezier(0.36, 0.07, 0.19, 0.97)",
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-strong": "pulse-strong 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "loading-dots": "loading-dots 1.4s ease-in-out infinite",
        "skeleton-wave": "skeleton-wave 1.6s ease-in-out infinite",
        "progress-indeterminate": "progress-indeterminate 2s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("flowbite/plugin"),
    // Performance and functionality plugins would go here
    // Note: Install these packages if needed:
    // npm install @tailwindcss/container-queries @tailwindcss/forms
  ],
  // Performance optimizations for production builds
  corePlugins: {
    // Keep essential plugins enabled
    preflight: true, // CSS reset
    container: true, // Container utilities
    accessibility: true, // Accessibility utilities
    // Disable unused plugins to reduce bundle size (uncomment as needed)
    // backdropOpacity: false,
    // backdropSaturate: false,
    // backdropSepia: false,
    // backdropHueRotate: false,
    // backdropInvert: false,
    // backdropGrayscale: false,
    // backdropContrast: false,
    // backdropBrightness: false,
    // backdropBlur: false,
  },
} satisfies Config;

export default config
