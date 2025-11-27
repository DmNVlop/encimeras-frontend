import js from "@eslint/js";
import globals, { node } from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
// 1. IMPORTAR EL PLUGIN DE IMPORTACIONES
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "public"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    // 2. CONFIGURAR EL RESOLVER PARA TYPESCRIPT
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.app.json", // O './tsconfig.json' según tu proyecto
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // 3. LA REGLA DE ORO: NO CICLOS
      "import/no-cycle": "error", // <--- Esto marcará error rojo si hay ciclos

      // Opcional: Reglas útiles extra de este plugin
      // 'import/no-unresolved': 'error', // Verifica que los imports existan
      // 'import/named': 'error', // Verifica que los exports nombrados existan
    },
  },
  eslintConfigPrettier,
);
