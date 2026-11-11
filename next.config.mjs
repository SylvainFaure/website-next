/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.{glsl,vs,fs,vert,frag}': {
        loaders: ['raw-loader'],
        as: '*.js'
      }
    }
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/i,
      type: 'asset/source'
    })
    return config
  },
  images: {
    // Book covers from Supabase Storage
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }]
  },
  experimental: {
    // Book cover uploads (4 MB max) go through server actions
    serverActions: { bodySizeLimit: '5mb' }
  },
  async redirects() {
    return [
      { source: '/calendar', destination: '/lists/concerts', permanent: true },
      { source: '/calendar/past', destination: '/lists/concerts/past', permanent: true }
    ]
  }
}

export default nextConfig
