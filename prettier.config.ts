import { type Config } from 'prettier';

const config: Config = {
  experimentalTernaries: true,
  experimentalOperatorPosition: 'end',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  objectWrap: 'preserve',
  bracketSameLine: true,
  arrowParens: 'avoid',
  quoteProps: 'consistent',
  requirePragma: false,
  insertPragma: false,
  checkIgnorePragma: false,
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  singleAttributePerLine: true,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
  ],
  tailwindStylesheet: './src/routes/layout.css',
};

export default config;
