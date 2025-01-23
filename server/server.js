const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect()
    .then(() => console.log('Connected to YugabyteDB'))
    .catch((err) => console.error('YugabyteDB connection error:', err));

const createTableQuery = `
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    gender VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address VARCHAR(255)
);
`;
pool.query(createTableQuery)
    .then(() => console.log('Patients table is ready'))
    .catch((err) => console.error('Error creating table:', err));

app.post('/api/register-patient', async (req, res) => {
    const { firstName, lastName, gender, age, phoneNumber, email, address } = req.body;
    if (!firstName || !lastName || !gender || !age || !phoneNumber || !email) {
        return res.json({ error: 'All mandatory fields are required' });
    }

    try {
        const maxId = await pool.query('SELECT COALESCE(MAX(id), 0) AS max_id FROM patients;');
        const nextId = maxId.rows[0].max_id + 1;
        const insertQuery = `
                INSERT INTO patients (id, first_name, last_name, gender, age, phone_number, email, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
        const values = [nextId, firstName, lastName, gender, age, phoneNumber, email, address];
        const result = await pool.query(insertQuery, values);

        res.json({ message: 'Patient registered successfully!', patient: result.rows[0] });
    } catch (error) {
        console.error('Error saving patient:', error);
        if (error.code === '23505') {
            res.json({ error: 'Email already exists.' });
        } else {
            res.json({ error: 'Failed to register patient.' });
        }
    }
});
const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
