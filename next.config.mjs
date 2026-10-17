/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/structural-labeling/action": [
      "./node_modules/@napi-rs/**/*",
      "./node_modules/pdfjs-dist/**/*",
    ],
  },
};

export default nextConfig;
