// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import MainLayout from './components/MainLayout'; // Importa el nuevo layout

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MainLayout /> {/* ¡Renderiza solo MainLayout aquí! */}
    </BrowserRouter>
  </StrictMode>,
);
