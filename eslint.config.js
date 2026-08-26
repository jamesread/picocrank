import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

export default [
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...pluginVue.configs['flat/recommended'],
	{
		files: ['**/*.{js,vue}'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
			}],
			'vue/multi-word-component-names': 'off',
			'vue/no-v-html': 'off',
			'vue/html-indent': 'off',
			'vue/max-attributes-per-line': 'off',
			'vue/singleline-html-element-content-newline': 'off',
			'vue/html-self-closing': 'off',
			'vue/multiline-html-element-content-newline': 'off',
			'vue/first-attribute-linebreak': 'off',
			'vue/html-closing-bracket-newline': 'off',
			'vue/attributes-order': 'off',
			'vue/attribute-hyphenation': 'off',
			'vue/v-on-event-hyphenation': 'off',
			'vue/no-spaces-around-equal-signs-in-attribute': 'off',
			'vue/require-default-prop': 'off',
			'vue/block-order': 'off',
			'vue/v-slot-style': 'off',
			'vue/html-closing-bracket-spacing': 'off',
		},
	},
	{
		files: ['**/*.vue'],
		languageOptions: {
			parser: vueParser,
			parserOptions: {
				parser: {
					js: 'espree',
					ts: tseslint.parser,
				},
				sourceType: 'module',
				extraFileExtensions: ['.vue'],
			},
		},
	},
	{
		files: ['**/*.vue'],
		rules: {
			'no-undef': 'off',
		},
	},
]
