import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/**/*.{ts,tsx,js,jsx}", "tests/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/types/*"],
              message: "Import feature-owned types from app/features/*/model instead of app/types.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='document'][callee.property.name='createElement'][arguments.0.type='Literal'][arguments.0.value='script']",
          message:
            "Imperative script injection is forbidden. Use next/script (or another framework-native loader) instead of document.createElement('script').",
        },
        {
          selector:
            "CallExpression[callee.object.name='document'][callee.property.name='createElement'][arguments.0.type='Literal'][arguments.0.value='SCRIPT']",
          message:
            "Imperative script injection is forbidden. Use next/script (or another framework-native loader) instead of document.createElement('script').",
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is forbidden in this codebase. Use safe text rendering or a non-dangerous render pipeline.",
        },
        {
          selector: "Property[key.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is forbidden in this codebase. Use safe text rendering or a non-dangerous render pipeline.",
        },
        {
          selector: "Property[key.type='Literal'][key.value='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML is forbidden in this codebase. Use safe text rendering or a non-dangerous render pipeline.",
        },
        {
          selector: "MemberExpression[computed=false][property.name='innerHTML']",
          message:
            "innerHTML access is forbidden in this codebase. Use controlled state, refs, or safe rendering primitives.",
        },
        {
          selector: "MemberExpression[computed=false][property.name='outerHTML']",
          message:
            "outerHTML access is forbidden in this codebase. Use controlled state, refs, or safe rendering primitives.",
        },
        {
          selector: "MemberExpression[computed=true][property.type='Literal'][property.value='innerHTML']",
          message:
            "innerHTML access is forbidden in this codebase. Use controlled state, refs, or safe rendering primitives.",
        },
        {
          selector: "MemberExpression[computed=true][property.type='Literal'][property.value='outerHTML']",
          message:
            "outerHTML access is forbidden in this codebase. Use controlled state, refs, or safe rendering primitives.",
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message:
            "insertAdjacentHTML is forbidden in this codebase. Use safe rendering primitives instead of string HTML insertion.",
        },
        {
          selector: "CallExpression[callee.object.name='document'][callee.property.name='write']",
          message:
            "document.write is forbidden in this codebase.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
