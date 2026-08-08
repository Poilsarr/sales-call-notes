import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", ".worktrees/**", "graphify-out/**", "node_modules/**", "public/**", "extension/**", "e2e/**"],
  },
];

export default eslintConfig;
