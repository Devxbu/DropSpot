const globals = require("globals");
const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const jestPlugin = require("eslint-plugin-jest");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

const tsConfig = {
  files: ["**/*.ts"],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: "./tsconfig.json",
    },
  },
  plugins: {
    "@typescript-eslint": tsPlugin,
  },
};

const jestConfig = {
  files: ["**/*.test.ts", "**/*.spec.ts"],
  plugins: {
    jest: jestPlugin,
  },
  rules: {
    ...jestPlugin.configs.recommended.rules,
    "jest/prefer-expect-assertions": "off",
  },
};

module.exports = [
  {
    ignores: ["node_modules/", "dist/", "coverage/", "*.config.js", "*.config.ts"],
  },
  {
    files: ["**/*.js"],
    languageOptions: { 
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  {
    ...tsConfig,
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...(tsPlugin.configs["eslint-recommended"]?.overrides?.[0]?.rules || {}),
      ...(tsPlugin.configs["recommended"]?.rules || {}),
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ...jestConfig,
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...(prettierConfig.rules || {}),
      ...prettierPlugin.configs.recommended.rules,
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
];