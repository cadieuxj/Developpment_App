import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Prevent usage of `any` type
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce consistent imports
      'import/no-duplicates': 'error',
      // React best practices
      'react/no-unescaped-entities': 'off',
      // Next.js specific
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
];

export default eslintConfig;
