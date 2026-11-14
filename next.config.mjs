/** @type {import("next").NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/account/header-session",
      headers: [{
        key: "Content-Security-Policy",
        value: "frame-ancestors https://snow.linkoteq.com https://wsection.linkoteq.com https://3dmodel.linkoteq.com",
      }],
    }];
  },
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
