/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // For static export to S3 (required for S3 deployment)
  output: 'export',
  images: {
    unoptimized: true,
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

