import './styles.css'
import React from "react";
import ReactDOM from "react-dom/client";
import App from './App.tsx'
import { UserProvider } from './context/userContext.tsx';
import {BrowserRouter} from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <BrowserRouter>
          <UserProvider>
              <App />
          </UserProvider>
      </BrowserRouter>
  </React.StrictMode>,
)
