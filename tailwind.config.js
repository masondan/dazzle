/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{svelte,js,html}'],
	theme: {
		extend: {
			colors: {
				dazzle: '#AA0171',
				'dazzle-light': '#D946A6'
			}
		}
	},
	plugins: [require('@tailwindcss/forms')]
};
