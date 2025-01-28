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

const createTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS family_groups (
                id SERIAL PRIMARY KEY
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                gender VARCHAR(255) NOT NULL,
                age INT NOT NULL,
                phone_number VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                address VARCHAR(255),
                family_group_id INT REFERENCES family_groups(id) ON DELETE SET NULL
            );
        `);

        console.log('Tables are ready');
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};
createTables();

// Register Patient Route
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

// Fetch returning patient data
app.get('/api/returning-patient/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const result = await pool.query('SELECT * FROM patients WHERE email = $1;', [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ error: 'Failed to retrieve patient data' });
    }
});

// Update an existing patient
app.put('/api/update-patient/:id', async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, gender, age, phoneNumber, email, address } = req.body;

    try {
        const updateQuery = `
            UPDATE patients
            SET first_name = $1, last_name = $2, gender = $3, age = $4, phone_number = $5, email = $6, address = $7
            WHERE id = $8 RETURNING *;
        `;
        const values = [firstName, lastName, gender, age, phoneNumber, email, address, id];
        const result = await pool.query(updateQuery, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({ message: 'Patient updated successfully!', patient: result.rows[0] });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Failed to update patient.' });
    }
});

app.post('/api/register-family', async (req, res) => {
    try {
        const { primaryMember, familyMembers } = req.body;

        // Debugging: Log received data
        console.log("📥 Received Family Registration Request:", req.body);

        // Validation: Ensure required data exists
        if (!primaryMember || !primaryMember.firstName || !primaryMember.lastName || !primaryMember.email) {
            console.error("❌ Missing Primary Member Data:", primaryMember);
            return res.status(400).json({ error: "Primary member details are incomplete." });
        }

        if (!Array.isArray(familyMembers) || familyMembers.length === 0) {
            console.error("❌ No Family Members Provided:", familyMembers);
            return res.status(400).json({ error: "At least one family member must be added." });
        }

        // Check if Primary Member already exists
        const existingPrimary = await pool.query(
            "SELECT id, family_group_id FROM patients WHERE email = $1;", 
            [primaryMember.email]
        );

        let familyGroupId;
        
        if (existingPrimary.rows.length > 0) {
            // Primary member exists, update their family_group_id
            console.log("🔄 Updating existing primary patient family group...");
            familyGroupId = existingPrimary.rows[0].family_group_id;

            if (!familyGroupId) {
                // If the primary member has no family group, create a new one
                const groupResult = await pool.query('INSERT INTO family_groups DEFAULT VALUES RETURNING id;');
                familyGroupId = groupResult.rows[0].id;

                // Update the primary member's `family_group_id`
                await pool.query(
                    "UPDATE patients SET family_group_id = $1 WHERE email = $2;", 
                    [familyGroupId, primaryMember.email]
                );
            }
        } else {
            // Primary member does not exist, create a new family group
            console.log("🆕 Creating new family group...");
            const groupResult = await pool.query('INSERT INTO family_groups DEFAULT VALUES RETURNING id;');
            familyGroupId = groupResult.rows[0].id;

            // Insert Primary Member
            const primaryInsert = `
                INSERT INTO patients (first_name, last_name, gender, age, phone_number, email, address, family_group_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
            const primaryValues = [
                primaryMember.firstName, 
                primaryMember.lastName, 
                primaryMember.gender,
                primaryMember.age, 
                primaryMember.phoneNumber || '', 
                primaryMember.email,
                primaryMember.address || '', 
                familyGroupId
            ];
            await pool.query(primaryInsert, primaryValues);
            console.log("✅ Primary Member Registered:", primaryMember.email);
        }

        // Insert Family Members
        for (const member of familyMembers) {
            if (!member.firstName || !member.lastName || !member.email) {
                console.warn("⚠️ Skipping Invalid Family Member:", member);
                continue;
            }

            // Ensure no duplicate family members with the same email
            const existingFamilyMember = await pool.query(
                "SELECT id FROM patients WHERE email = $1;", 
                [member.email]
            );

            if (existingFamilyMember.rows.length > 0) {
                console.warn(`⚠️ Family Member with email ${member.email} already exists. Skipping.`);
                continue; // Skip duplicate entries
            }

            const familyInsert = `
                INSERT INTO patients (first_name, last_name, gender, age, phone_number, email, address, family_group_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `;
            const familyValues = [
                member.firstName, 
                member.lastName, 
                member.gender, 
                member.age,
                member.phoneNumber || '',
                member.email,
                member.address || '',
                familyGroupId
            ];

            await pool.query(familyInsert, familyValues);
            console.log(`✅ Family Member Registered: ${member.firstName} ${member.lastName}`);
        }

        res.json({
            message: "Family registered successfully!",
            familyGroupId
        });
    } catch (error) {
        console.error("❌ Error registering family:", error);
        res.status(500).json({ error: "Failed to register family. See server logs for details." });
    }
});




const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
