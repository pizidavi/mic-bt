import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['react'],
  categories: {
    correctness: 'error',
    perf: 'error',
    restriction: 'error',
    suspicious: 'error',
    style: 'error',
    pedantic: 'error',
  },
  rules: {
    curly: 'off',
    'max-lines-per-function': 'off',
    'func-style': 'off',
    'id-length': 'off',
    'no-implicit-coercion': 'off',
    'no-magic-numbers': 'off',
    'no-ternary': 'off',
    'one-var': 'off',
    'sort-imports': 'off',
    'sort-keys': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    'react/jsx-props-no-spreading': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/forbid-component-props': 'off',
  },
  ignorePatterns: ['.expo/**', 'android/**', 'ios/**', 'uniwind.config.ts'],
  options: {
    typeAware: true,
  },
});
