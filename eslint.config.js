import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".npm-cache/**",
      "reports/**",
    ],
  },
  ...tseslint.configs.recommended,
  { rules: { "@typescript-eslint/no-explicit-any": "off" } },
);
