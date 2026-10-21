import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // All UI text must come from messages/*.json (i18n from day one).
    files: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["·", "/", ":", "–", "—", "(", ")", "×", "•"] },
      ],
    },
  },
  {
    // Services and shared code must stay framework-agnostic (future mobile API).
    files: ["src/server/services/**/*.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["next", "next/*", "react", "react-dom", "next-intl", "next-intl/*"],
              message: "Services/shared code must not depend on Next.js or React.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "drizzle/**",
    "screenshots/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
