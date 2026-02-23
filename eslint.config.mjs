import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "logs/**",
      "backend/**",
      "duotrak-dashboard (5)/**",
      "duotrak-ui/**",
      "duotrak_improved_ui/**",
      "convex/_generated/**",
      "**/.pytest_cache/**",
      "**/venv/**",
      "**/dist/**",
      "**/build/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "off",
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
