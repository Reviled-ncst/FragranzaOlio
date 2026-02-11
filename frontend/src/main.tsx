import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode disabled due to conflicts with Supabase auth locks
// Can be re-enabled in production build
createRoot(document.getElementById('root')!).render(
  <App />
)
