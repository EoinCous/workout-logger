import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './css/index.css';
import App from './App.jsx';
import { AuthenticationProvider } from './context/AuthenticationContext';
import { WorkoutProvider } from './context/WorkoutContext.jsx';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true); 
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

// Check for updates whenever the user opens or refocuses the app on their phone
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateSW(); 
  }
});

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