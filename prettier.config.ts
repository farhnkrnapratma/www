import { type Config } from 'prettier';

const config: Config = {
  experimentalTernaries: true,
  experimentalOperatorPosition: "end",
  printWidth: 100,
  tabWidth: 2,
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	],
	// @ts-expect-error
	tailwindStylesheet: './src/routes/layout.css'
};

export default config;
