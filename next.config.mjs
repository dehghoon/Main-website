/** @type {import("next").NextConfig} */
const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/**/*",
  "./node_modules/pdfjs-dist/**/*",
];

const nextConfig = {
  serverExternalPackages: ["@napi-rs/canvas"],
  outputFileTracingIncludes: {
    "/api/structural-labeling/action": pdfRuntimeFiles,
    "/api/structural-labeling/gpt7-handoffs/retry": pdfRuntimeFiles,
  },
};

export default nextConfig;
