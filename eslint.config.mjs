import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      js
    },
    extends: ["js/recommended"]
  },
  tseslint.configs.recommended,
  {
    files: ["src/utils/dbReconnect.ts", "src/controllers/BaseController.ts"], // Ganti dengan nama file yang kamu inginkan
    rules: {
      "@typescript-eslint/no-explicit-any": "off" // Menonaktifkan aturan di file ini
    }
  }
]);
