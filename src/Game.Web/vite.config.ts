import {defineConfig} from 'vite';

// The same static files must work at a domain root and at /jyxr/ on Pages.
export default defineConfig({base: './'});
