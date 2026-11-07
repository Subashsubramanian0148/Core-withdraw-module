import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import TransactionSummary from './TransactionSummary.jsx'
import './styles.css'
// ?view=transaction opens the redesigned Transaction summary
const view = new URLSearchParams(window.location.search).get('view')
createRoot(document.getElementById('root')).render(view === 'transaction' ? <TransactionSummary /> : <App />)
