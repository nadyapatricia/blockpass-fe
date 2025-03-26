/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.loket.com",
        port: "",
        pathname: "/images/ss/**",
        search: "",
      },
    ],
  },
  // fixes wallet connect dependency issue https://docs.walletconnect.com/web3modal/nextjs/about#extra-configuration
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
