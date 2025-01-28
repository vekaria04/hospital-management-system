import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientRegistrationForm from './PatientRegistration/PatientRegistrationForm';
import GroupRegistrationForm from './PatientRegistration/GroupRegistrationForm';

const App = () => (
  <Router>
    <Routes>
      <Route path="/register" element={<PatientRegistrationForm />} />
      <Route path="/groupregister" element={<GroupRegistrationForm />} />
    </Routes>
  </Router>
);

export default App;
