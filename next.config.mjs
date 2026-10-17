/** @type {import("next").NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist/legacy/build/pdf.mjs": "pdfjs-dist/build/pdf.mjs",
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs": "pdfjs-dist/build/pdf.worker.min.mjs",
      };
    }
    return config;
  },
};

export default nextConfig;
