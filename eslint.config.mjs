import { defineConfig, globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default defineConfig([
  tseslint.configs.recommended,
  pluginVue.configs["flat/recommended"],
  {
    // In .vue files, <script lang="ts"> is parsed by the TypeScript parser.
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Browser code must never import server/ (player data, secret).
    files: ["src/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/server/*", "**/server/*"] }],
    },
  },
  {
    // Formatting is handled by Prettier.
    rules: {
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/html-self-closing": "off",
      "vue/html-indent": "off",
      "vue/html-closing-bracket-newline": "off",
    },
  },
  globalIgnores(["node_modules/**", "dist/**"]),
]);
