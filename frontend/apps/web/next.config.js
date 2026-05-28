import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export default {
  reactStrictMode: true,
  outputFileTracingRoot: webRoot,
  turbopack: {
    root: webRoot,
  },
};
