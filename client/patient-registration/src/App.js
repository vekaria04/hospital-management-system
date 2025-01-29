import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientRegistrationForm from './PatientRegistration/PatientRegistrationForm';
import GroupRegistrationForm from './PatientRegistration/GroupRegistrationForm';
import Homepage from './Homepage';
import EditFamilyGroups from './FamilyGroups/EditFamilyGroups';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/register" element={<PatientRegistrationForm />} />
      <Route path="/groupregister" element={<GroupRegistrationForm />} />
      <Route path="/edit-family-group" element={<EditFamilyGroups />} />
    </Routes>
  </Router>
);

export default App;
