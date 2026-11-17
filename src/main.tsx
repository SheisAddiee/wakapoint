import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

document.addEventListener('keydown', () => { document.documentElement.dataset.inputModality = 'keyboard'; }, { capture: true });
document.addEventListener('pointerdown', () => { document.documentElement.dataset.inputModality = 'pointer'; }, { capture: true });

createRoot(document.getElementById('root')!).render(<App />);
