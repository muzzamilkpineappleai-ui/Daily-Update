import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Panel from './Main/Panel';
import LoginForm from './pages/LoginFormPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginForm />} />

        {/* If not logged in → ProtectedRoute will block inside Panel */}
        <Route path="/*" element={<Panel />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
