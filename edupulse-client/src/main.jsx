import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx' // IMPORT THIS

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>  {/* WRAP THE APP HERE */}
            <App />
        </AuthProvider>
    </StrictMode>,
)