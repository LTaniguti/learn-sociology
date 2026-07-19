import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Acceptance renders from the design sessions: self-contained tool
    // exports, not app source, and never bundled. Same exemption in spirit as
    // tokens.css/theme-*.css sitting outside the hex-literal guard.
    "docs/design/hifi/**",
  ]),
]);

export default eslintConfig;
