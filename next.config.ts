import type { NextConfig } from "next";

const storageBucketName = process.env.S3_BUCKET_NAME;
const storageBucketRegion = process.env.S3_BUCKET_REGION;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns:
      storageBucketName && storageBucketRegion
        ? [
            {
              protocol: "https",
              hostname: `${storageBucketName}.s3.${storageBucketRegion}.amazonaws.com`,
            },
          ]
        : [],
  },
  // Ensure we are Vercel-friendly
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default nextConfig;
