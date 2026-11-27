import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // __fixtures__ hold deliberately bad code; tests lint them with `ignore: false`.
  {
    ignores: [".claude", "dist", "node_modules", "proto", "**/__fixtures__/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: { globals: globals.browser },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The engine is pure: no rendering, no host APIs, no knowledge of the
    // layers built on top of it.
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^react($|-dom($|/)|/)",
              message: "src/engine must not depend on React.",
            },
            {
              regex: "^node:",
              message: "src/engine must not depend on Node built-ins.",
            },
            {
              // Only paths that climb out (`../`) or are src-rooted count as
              // leaving the engine; `./sim` inside the engine is fine.
              regex: "^(/?src/|(\\.\\./)+)(ui|ai|sim)($|/)",
              message: "src/engine must not import src/ui, src/ai or src/sim.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}", "src/main.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
