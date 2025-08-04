import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './css/index.css';
import App from './App.jsx';
import { AuthenticationProvider } from './context/AuthenticationContext';
import { WorkoutProvider } from './context/WorkoutContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthenticationProvider>   
        <WorkoutProvider>
          <App />
        </WorkoutProvider>
      </AuthenticationProvider>
    </BrowserRouter>
  </StrictMode>
);