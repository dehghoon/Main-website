/** @type {import("next").NextConfig} */
const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
  "./node_modules/pdfjs-dist/**/*",
];

const nextConfig = {
  outputFileTracingIncludes: {
    "/*": pdfRuntimeFiles,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@napi-rs/canvas-linux-x64-gnu": "commonjs @napi-rs/canvas-linux-x64-gnu",
        "@napi-rs/canvas-linux-x64-musl": "commonjs @napi-rs/canvas-linux-x64-musl",
      });
    }
    return config;
  },
};

export default nextConfig;
