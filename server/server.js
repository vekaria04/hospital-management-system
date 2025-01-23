const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
mongoose
    .connect('mongodb://localhost:27017/3350', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
const patientSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    age: { type: Number, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String },
});

const Patient = mongoose.model('Patient', patientSchema);

app.post('/api/register-patient', async (req, res) => {
    const { firstName, lastName, gender, age, phoneNumber, email, address } = req.body;
    if (!firstName || !lastName || !gender || !age || !phoneNumber || !email) {
        return res.status(400).json({ error: 'All mandatory fields are required' });
    }
    try {
        const newPatient = new Patient({ firstName, lastName, gender, age, phoneNumber, email, address });
        const savedPatient = await newPatient.save();
        res.status(201).json({ message: 'Patient registered successfully!', patient: savedPatient });
    } catch (error) {
        console.error('Error saving patient:', error);
        if (error.code === 11000) {
            res.status(400).json({ error: 'Email already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to register patient.' });
        }
    }
});

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));