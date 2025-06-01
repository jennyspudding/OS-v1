const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your Next.js config
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lbinjgbiugpvukqjclwd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', // Allow any path under public storage
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Added unsplash as it was used in fallback banners
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Example for images domain configuration (uncomment and modify if needed):
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'your-image-domain.com',
  //       port: '',
  //       pathname: '/images/**',
  //     },
  //   ],
  // },
}); 