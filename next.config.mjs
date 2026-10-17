/** @type {import("next").NextConfig} */
const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
  "./node_modules/pdfjs-dist/**/*",
];

const nextConfig = {
  // Bundle the @napi-rs/canvas JavaScript wrapper into server functions.
  // The platform-specific native binaries remain explicitly traced.
  outputFileTracingIncludes: {
    "/*": pdfRuntimeFiles,
  },
};

export default nextConfig;
