import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { HashRouter } from 'react-router-dom';
import './global.css'


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);

if (window.require) {
  window.require('electron');
  console.log('Running in Electron');
  // You can use ipcRenderer here if needed
  // For example:
  // ipcRenderer.on('some-event', (event, arg) => {
  //   console.log(arg);
  // });
} else {
  console.log('Running in Browser');
}
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
