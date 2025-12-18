import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import VConsole from 'vconsole'
import './index.css'
import App from './App.jsx'

//const vConsole = new VConsole()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
