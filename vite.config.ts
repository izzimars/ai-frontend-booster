import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      // Alias @ to the src directory
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: /^lodash$/, replacement: 'lodash-es' },
      { find: /^lodash\/(.*)$/, replacement: 'lodash-es/$1' },
    ],
  },

  optimizeDeps: {
    // Avoid pre-bundling packages that tend to produce stale/missing chunk refs.
    exclude: ['xlsx'],
    include: ['recharts', 'lodash-es'],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
