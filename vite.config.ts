import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          'charts-vendor': ['recharts'],
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
