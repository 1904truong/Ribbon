import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './ribbon/ribbon.css';
import './typeset.css';
import './app.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
