import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './services/authContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
