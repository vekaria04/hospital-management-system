import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [editDoctor, setEditDoctor] = useState(null);
  const [newDoctor, setNewDoctor] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialty: "",
    password: "" // New field
  });  const [doctorForm, setDoctorForm] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", specialty: "" });

  // ✅ Fetch all doctors on page load
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = () => {
    const token = localStorage.getItem("token"); // ✅ Get Token
    if (!token) {
      console.error("❌ No token found. Redirecting to login.");
      navigate("/login");
      return;
    }

    fetch("/api/doctors", {
      headers: { Authorization: `Bearer ${token}` }, // ✅ Include Token
    })
      .then((res) => res.json())
      .then((data) => setDoctors(data))
      .catch((err) => console.error("❌ Error fetching doctors:", err));
  };

  // ✅ Fetch patients of a specific doctor
  const handleViewPatients = (doctorId) => {
    const token = localStorage.getItem("token");

    fetch(`/api/doctors/${doctorId}/patients`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setSelectedDoctor(doctorId);
        setPatients(data);
      })
      .catch((err) => console.error("❌ Error fetching patients:", err));
  };

  // ✅ Add a new doctor
  const handleAddDoctor = () => {
    const token = localStorage.getItem("token");
  
    fetch("/api/doctors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newDoctor),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("❌ Error adding doctor:", data.error);
          return;
        }
  
        setDoctors([...doctors, data.doctor]); // ✅ Update UI
        setNewDoctor({ firstName: "", lastName: "", email: "", phoneNumber: "", specialty: "", password: "" }); // ✅ Reset Form
      })
      .catch((err) => console.error("❌ Error adding doctor:", err));
  };
  

  // ✅ Handle doctor edit
  const handleEditDoctor = (doctor) => {
    setEditDoctor(doctor.id);
    setDoctorForm({
      firstName: doctor.first_name,
      lastName: doctor.last_name,
      email: doctor.email,
      phoneNumber: doctor.phone_number,
      specialty: doctor.specialty,
    });
  };

  // ✅ Submit edited doctor details
  const handleSaveEdit = () => {
    const token = localStorage.getItem("token");
  
    fetch(`/api/doctors/${editDoctor}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(doctorForm),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("❌ Error updating doctor:", data.error);
          return;
        }
  
        // ✅ Update the doctors list in the UI
        setDoctors(doctors.map((d) => (d.id === editDoctor ? { ...d, ...data.doctor } : d)));
        
        console.log("✅ Doctor updated in frontend:", data.doctor);
  
        // ✅ Clear edit mode
        setEditDoctor(null);
      })
      .catch((err) => console.error("❌ Error updating doctor:", err));
  };
  

  // ✅ Remove a doctor
  const handleRemoveDoctor = (doctorId) => {
    const token = localStorage.getItem("token");
  
    fetch(`/api/doctors/${doctorId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("❌ Error deleting doctor:", data.error);
          return;
        }
  
        // ✅ Remove the doctor from the frontend state
        setDoctors(doctors.filter((doctor) => doctor.id !== doctorId));
  
        console.log("✅ Doctor deleted successfully:", data.doctor);
      })
      .catch((err) => console.error("❌ Error deleting doctor:", err));
  };
  

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>

      {/* ✅ Add Doctor Form */}
      <div className="w-full max-w-md bg-white p-4 rounded shadow mb-6">
        <h2 className="text-2xl font-semibold mb-2">Add Doctor</h2>
        <input type="text" placeholder="First Name" value={newDoctor.firstName} onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <input type="text" placeholder="Last Name" value={newDoctor.lastName} onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <input type="email" placeholder="Email" value={newDoctor.email} onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <input type="password" placeholder="Password" value={newDoctor.password} onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <input type="text" placeholder="Phone Number" value={newDoctor.phoneNumber} onChange={(e) => setNewDoctor({ ...newDoctor, phoneNumber: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <input type="text" placeholder="Specialty" value={newDoctor.specialty} onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })} className="w-full p-2 border rounded mb-2" />
        <button onClick={handleAddDoctor} className="bg-green-500 text-white px-4 py-2 rounded">Add Doctor</button>
      </div>

      {/* ✅ Doctor List */}
      <h2 className="text-2xl font-semibold mb-2">Doctors</h2>
      <ul className="w-full max-w-2xl bg-white p-4 rounded shadow">
        {doctors.map((doctor) => (
          <li key={doctor.id} className="p-2 border-b flex justify-between">
            <span>{doctor.first_name} {doctor.last_name} - {doctor.specialty} ({doctor.email})</span>
            <div>
              <button onClick={() => handleViewPatients(doctor.id)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">View Patients</button>
              <button onClick={() => handleEditDoctor(doctor)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
              <button onClick={() => handleRemoveDoctor(doctor.id)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
            </div>
          </li>
        ))}
      </ul>

      {/* ✅ Edit Doctor Form */}
      {editDoctor && (
        <div className="w-full max-w-md mt-4 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Edit Doctor</h3>
          <input className="w-full p-2 border rounded mb-2" type="text" placeholder="First Name" value={doctorForm.firstName} onChange={(e) => setDoctorForm({ ...doctorForm, firstName: e.target.value })} />
          <input className="w-full p-2 border rounded mb-2" type="text" placeholder="Last Name" value={doctorForm.lastName} onChange={(e) => setDoctorForm({ ...doctorForm, lastName: e.target.value })} />
          <input className="w-full p-2 border rounded mb-2" type="email" placeholder="Email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
          <button onClick={handleSaveEdit} className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
