import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PatientRegistrationForm from './PatientRegistration/PatientRegistrationForm';
import GroupRegistrationForm from './PatientRegistration/GroupRegistrationForm';
import Homepage from './Homepage';
import EditFamilyGroups from './FamilyGroups/EditFamilyGroups';
import HealthQuestionnaire from './PatientRegistration/HealthQuestionnaire';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/register" element={<PatientRegistrationForm />} />
      <Route path="/groupregister" element={<GroupRegistrationForm />} />
      <Route path="/edit-family-group" element={<EditFamilyGroups />} />
      <Route path="/health-questionnaire/:patientId" element={<HealthQuestionnaire />} />
    </Routes>
  </Router>
);

export default App;
