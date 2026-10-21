import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/<اسم_المستودع>/', // مثال: '/quantum-pos/'
})