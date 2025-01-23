import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientRegistrationForm from './PatientRegistration/PatientRegistrationForm';

const App = () => (
  <Router>
    <Routes>
      <Route path="/register" element={<PatientRegistrationForm />} />
    </Routes>
  </Router>
);

export default App;
