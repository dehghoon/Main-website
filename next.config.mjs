/** @type {import("next").NextConfig} */
const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
  "./node_modules/pdfjs-dist/**/*",
];

const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/*": pdfRuntimeFiles,
  },
};

export default nextConfig;
