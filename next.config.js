const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For static export to S3 (required for S3 deployment)
  // Disable static export in development to allow dynamic routes
  ...(process.env.SKIP_STATIC_EXPORT !== 'true' && { output: 'export' }),
  // Generate /page/index.html instead of /page.html for S3 website hosting
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Webpack config to resolve design-system path alias and fix CSS HMR
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@design-system': path.resolve(__dirname, '../design-system/src'),
    };
    
    // Fix for CSS HMR issue in development
    if (dev && !isServer) {
      // Improve CSS HMR handling
      const MiniCssExtractPlugin = config.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      if (MiniCssExtractPlugin) {
        MiniCssExtractPlugin.options.ignoreOrder = true;
      }
    }
    
    return config;
  },
  // Intentionally permissive CORS for lab (security vulnerability)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

