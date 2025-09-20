/** @type {import("next").NextConfig} */
// Phase 1 Frontend-Backend Separation: Static Export Configuration
const nextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: ""
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: ""
      },
      {
        protocol: "https",
        hostname: "pub-b7fd9c30cdbf439183b75041f5f71b92.r2.dev",
        port: ""
      },
      {
        protocol: "https",
        hostname: "yrssspoimsxpibcbeaca.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "staging.sellica.com",
        port: "",
        pathname: "/storage/**"
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization for static export
    unoptimized: true,
  },

  // Security headers
  poweredByHeader: false,
  generateEtags: false,

  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    STAGING_METRICS_ENDPOINT: process.env.STAGING_METRICS_ENDPOINT,
    BUILD_VERSION: process.env.BUILD_VERSION || '2.0',
    BUILD_ID: process.env.BUILD_ID || 'unknown',
    DEPLOYMENT_TIMESTAMP: process.env.DEPLOYMENT_TIMESTAMP,
  },

  // Server external packages (moved from experimental)
  serverExternalPackages: ['@tensorflow/tfjs-node'],

  // Experimental features for staging
  experimental: {
    // Disable CSS optimization to avoid critters issues
    // optimizeCss: true,
    optimizeServerReact: true,
    // Enable modern bundling
    esmExternals: true,
  },

  // Webpack configuration for staging optimization
  webpack: (config, { dev, isServer, webpack }) => {
    // Production optimizations in staging
    if (!dev && !isServer) {
      // Enable production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // TensorFlow.js bundle optimization
          tensorflow: {
            test: /[\\/]node_modules[\\/]@tensorflow[\\/]/,
            name: 'tensorflow',
            chunks: 'all',
            priority: 10,
          },
          // Supabase bundle optimization
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 9,
          },
          // UI libraries bundle
          ui: {
            test: /[\\/]node_modules[\\/](react|react-dom|@radix-ui|@mui)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 8,
          },
          // Vendor bundle for other dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
          },
        },
      };

      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Add performance monitoring
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.WEBPACK_BUILD_TIME': JSON.stringify(new Date().toISOString()),
        'process.env.WEBPACK_BUILD_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      })
    );

    return config;
  },

  // Performance monitoring for staging
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Compression and optimization
  compress: true,

  // Static file serving optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL : '',

  // Custom headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },

      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/models/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },



  // Output configuration - Enable static export for CDN deployment
  output: 'export',
};

export default nextConfig;