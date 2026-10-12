import { defineConfig, globalIgnores } from "eslint/config";
import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";

export default defineConfig([
  tseslint.configs.recommended,
  pluginVue.configs["flat/recommended"],
  {
    // Dans les fichiers .vue, le <script lang="ts"> est analysé par le parser TypeScript.
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Le code du navigateur ne doit jamais importer server/ (données des joueurs, secret).
    files: ["src/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@/server/*", "**/server/*"] }],
    },
  },
  {
    // Le formatage est géré par Prettier.
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
