/** @type {import('next').NextConfig} */
const isGithubPages = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGithubPages ? '/countdown-game' : '',
  assetPrefix: isGithubPages ? '/countdown-game' : '',
};

export default nextConfig;
