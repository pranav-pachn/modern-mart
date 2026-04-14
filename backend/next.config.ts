import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadRootEnv() {
  const rootEnvPath = path.resolve(__dirname, "..", ".env");

  if (!existsSync(rootEnvPath)) {
    return;
  }

  const envContent = readFileSync(rootEnvPath, "utf8");

  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
}

loadRootEnv();

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
