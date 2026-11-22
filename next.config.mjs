/** @type {import("next").NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      ...[ ["wood.linkoteq.com", "wood-design"], ["beamconcrete.linkoteq.com", "concrete-beam"] ].flatMap(([host, tool]) => [
        { source: "/", has: [{ type: "host", value: host }], destination: `https://www.linkoteq.com/tools/${tool}`, permanent: false },
        { source: "/:path*", has: [{ type: "host", value: host }], destination: "https://www.linkoteq.com/:path*", permanent: false },
      ]),
    ];
  },
  async headers() {
    return [{
      source: "/fonts/:path*",
      headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
    }, {
      source: "/account/header-session",
      headers: [{
        key: "Content-Security-Policy",
        value: "frame-ancestors https://snow.linkoteq.com https://wsection.linkoteq.com https://3dmodel.linkoteq.com https://wind-calculator.vercel.app https://linkoteq-seismic-preview.vercel.app https://wind.linkoteq.com https://seismic.linkoteq.com",
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
