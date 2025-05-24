  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import { BrowserRouter } from 'react-router-dom';
  import { AuthProvider } from './context/authContext';
  import { NotificationProvider } from './context/NotificationContext';
  import App from './App';
  import Modal from 'react-modal';
  import { configureCharts } from './config/chartConfig'; 
configureCharts();
  // Set the app element for react-modal
  Modal.setAppElement('#root');

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
