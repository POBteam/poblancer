const config = {
  distDir: process.env.POB_DEVELOPMENT === '1' ? '.next-dev' : '.next-production',
  poweredByHeader: false,
  devIndicators: false,
  // Keep local builds from starting nine page-generation workers alongside LocalWP.
  experimental: {cpus: 2},
  allowedDevOrigins: ['poblancer.local'],
  async headers() { return [{source:'/:path*',headers:[
    {key:'X-Robots-Tag',value:'noindex, nofollow'},
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'same-origin'},
    {key:'X-Frame-Options',value:'DENY'}
  ]}]; }
};
export default config;
