import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '../../src/index.css' // 引用主專案的 Tailwind 設定

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
