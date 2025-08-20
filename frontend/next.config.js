/** @type {import('next').NextConfig} */

// Import quiet build utility to suppress verbose logging during build
if (process.env.DISABLE_RUNTIME_LOGS === 'true') {
  try {
    require('./src/utils/quietBuild.ts');
  } catch (e) {
    // Ignore if file doesn't exist during initial setup
  }
}

const nextConfig = {
  // Enable experimental features for better optimization
  experimental: {
    // Enable modern bundling optimizations
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@heroicons/react',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yrssspoimsxpibcbeaca.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Suppress warnings from external libraries
    config.ignoreWarnings = [
      // Suppress Supabase realtime warning
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Suppress other common warnings
      /Critical dependency: the request of a dependency is an expression/,
    ];

    // Production optimizations
    if (!dev) {
      // Optimize bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate UI library chunks
            mui: {
              test: /[\\/]node_modules[\\/]@mui[\\/]/,
              name: 'mui',
              chunks: 'all',
              priority: 20,
            },
            // Separate TensorFlow chunks
            tensorflow: {
              test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
              name: 'tensorflow',
              chunks: 'all',
              priority: 20,
            },
            // Separate chart libraries
            charts: {
              test: /[\\/]node_modules[\\/](recharts|chart\.js|react-chartjs-2|apexcharts|react-apexcharts)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };

      // Minimize bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use lighter alternatives where possible
        'react-dom/server': 'react-dom/server.browser',
      };
    }

    // Exclude heavy dependencies from client bundle when possible
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
      };
    }

    // Keep TensorFlow.js imports as-is for compatibility
    // The optimization will be handled by the bundle splitting instead

    return config;
  },

  // Compress responses
  compress: true,

  // Optimize static generation
  trailingSlash: false,
  
  // Reduce build output
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },

  // Environment variables optimization
  env: {
    // Only include necessary environment variables
    NEXT_PUBLIC_ENABLE_TENSORFLOW: process.env.NEXT_PUBLIC_ENABLE_TENSORFLOW,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Output optimization (disabled standalone due to Windows symlink issues)
  // output: 'standalone',
  
  // Disable source maps in production to save space
  productionBrowserSourceMaps: false,
  
  // Reduce JavaScript bundle size
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
};

module.exports = nextConfig;
