const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const validator = require("validator");
const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(passport.initialize());

const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool
  .connect()
  .then(() => console.log("Connected to YugabyteDB"))
  .catch((err) => console.error("YugabyteDB connection error:", err));

  const createTables = async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'User' CHECK (role IN ('User','Volunteer', 'Doctor', 'Admin')),
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT
        );
      `);
  
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
            family_group_id INT REFERENCES family_groups(id) ON DELETE SET NULL,
            assigned_doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL
        );
      `);
  
      await pool.query(`
        CREATE TABLE IF NOT EXISTS doctors (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone_number VARCHAR(255),
            specialty VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
  
      await pool.query(`
        CREATE TABLE IF NOT EXISTS health_questionnaires (
            id SERIAL PRIMARY KEY,
            patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
            allergies TEXT,
            primary_language VARCHAR(255) NOT NULL,
            other_primary_language VARCHAR(255),
            preferred_language VARCHAR(255),
            other_preferred_language VARCHAR(255),
            primary_concern TEXT NOT NULL,
            symptom_duration VARCHAR(255),
            symptom_triggers TEXT,
            pain_level INT CHECK (pain_level BETWEEN 1 AND 10) NULL, -- Allow NULL instead of empty string
            chronic_conditions TEXT,
            past_surgeries TEXT,
            medications TEXT,
            family_history TEXT,
            diet TEXT,
            substance_use TEXT,
            physical_activity TEXT,
            menstrual_cycle VARCHAR(255),
            pregnancy_status VARCHAR(50) CHECK (pregnancy_status IN ('Yes', 'No', 'Unknown')),
            mental_health TEXT,
            sleep_concerns TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
  
      // Create default Admin user
      await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, role, is_verified)
        VALUES ('Admin', 'User', 'dnagpal2@uwo.com', '${await bcrypt.hash(
          "pass",
          10
        )}', 'Admin', TRUE)
        ON CONFLICT (email) DO NOTHING;
      `);
  
      console.log("✅ Tables are ready.");
    } catch (err) {
      console.error("❌ Error creating tables:", err);
    }
  };
  
createTables();
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access Denied" });
    }
    next();
  };
};
app.post("/api/register-patient", async (req, res) => {
  const { firstName, lastName, gender, age, phoneNumber, email, address } =
    req.body;

  if (!firstName || !lastName || !gender || !age || !phoneNumber || !email) {
    return res.status(400).json({ error: "All mandatory fields are required" });
  }

  try {
    const insertQuery = `
            INSERT INTO patients (first_name, last_name, gender, age, phone_number, email, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, first_name, last_name, email;
        `;
    const values = [
      firstName,
      lastName,
      gender,
      age,
      phoneNumber,
      email,
      address,
    ];
    const result = await pool.query(insertQuery, values);

    console.log("🔹 New Patient Created:", result.rows[0]); // Debugging

    if (result.rows.length > 0) {
      return res.status(201).json({
        message: "Patient registered successfully!",
        patient: result.rows[0], // Ensuring patient object is returned
      });
    } else {
      return res.status(500).json({ error: "Failed to register patient." });
    }
  } catch (error) {
    console.error("Error saving patient:", error);
    return res.status(500).json({ error: "Failed to register patient." });
  }
});

app.get("/api/verify/:token", async (req, res) => {
  const { token } = req.params;
  console.log("Received verification token:", token); // Debugging

  try {
    // Decode JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "3350Group16");
    console.log("Decoded token:", decoded); // Debugging

    // Check if user exists in users table
    const userResult = await pool.query(
      "SELECT id, email, is_verified FROM users WHERE email = $1",
      [decoded.email]
    );

    if (userResult.rowCount === 0) {
      console.error("User not found for email:", decoded.email);
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const user = userResult.rows[0];

    // If already verified
    if (user.is_verified) {
      return res.status(400).json({ error: "Email is already verified." });
    }

    // Update is_verified to TRUE
    await pool.query(
      "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE email = $1",
      [decoded.email]
    );

    console.log(`User ${user.id} verified successfully`);

    // Fetch the patient ID associated with this email
    const patientResult = await pool.query(
      "SELECT id FROM patients WHERE email = $1",
      [decoded.email]
    );

    if (patientResult.rowCount === 0) {
      return res.status(400).json({ error: "Patient record not found." });
    }

    const patient = patientResult.rows[0];

    // Return `patient.id` to frontend for correct redirection
    res.status(200).json({
      message: "Email verified successfully!",
      userId: patient.id, // Sending patient ID instead of user ID
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(400).json({ error: "Invalid or expired token." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Check if user exists (Search in both users and doctors table)
    let user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (user.rows.length === 0) {
      user = await pool.query("SELECT * FROM doctors WHERE email = $1", [email]);
    }

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ✅ Compare passwords
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ✅ Get user role
    const role = user.rows[0].role || "Doctor"; // Default to Doctor if role is missing

    // ✅ Generate JWT Token (Include role)
    const token = jwt.sign(
      { id: user.rows[0].id, role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ message: "Login successful", token, role });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
});

//Admin Promotes a User to Doctor
app.put(
  "/api/promote/:id",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "UPDATE users SET role = 'Doctor' WHERE id = $1 RETURNING id, email, role",
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User promoted to Doctor", user: result.rows[0] });
    } catch (error) {
      console.error("❌ Error promoting user:", error);
      res.status(500).json({ error: "Error promoting user" });
    }
  }
);

// Route to submit health questionnaire
app.post("/api/submit-health-questionnaire", async (req, res) => {
  let {
    patientId,
    allergies,
    primaryLanguage,
    preferredLanguage,
    primaryConcern,
    symptomDuration,
    symptomTriggers,
    painLevel,
    chronicConditions,
    pastSurgeries,
    medications,
    familyHistory,
    diet,
    substanceUse,
    physicalActivity,
    menstrualCycle,
    pregnancyStatus,
    mentalHealth,
    sleepConcerns,
  } = req.body;

  // Convert empty strings to NULL
  const convertToNull = (value) => (value === "" ? null : value);

  patientId = convertToNull(patientId);
  allergies = convertToNull(allergies);
  primaryLanguage = convertToNull(primaryLanguage);
  preferredLanguage = convertToNull(preferredLanguage);
  primaryConcern = convertToNull(primaryConcern);
  symptomDuration = convertToNull(symptomDuration);
  symptomTriggers = convertToNull(symptomTriggers);
  painLevel = convertToNull(painLevel !== "" ? parseInt(painLevel, 10) : null); // Convert to integer or NULL
  chronicConditions = convertToNull(chronicConditions);
  pastSurgeries = convertToNull(pastSurgeries);
  medications = convertToNull(medications);
  familyHistory = convertToNull(familyHistory);
  diet = convertToNull(diet);
  substanceUse = convertToNull(substanceUse);
  physicalActivity = convertToNull(physicalActivity);
  menstrualCycle = convertToNull(menstrualCycle);
  pregnancyStatus = convertToNull(pregnancyStatus);
  mentalHealth = convertToNull(mentalHealth);
  sleepConcerns = convertToNull(sleepConcerns);

  try {
    const insertQuery = `
        INSERT INTO health_questionnaires (
            patient_id, allergies, primary_language, preferred_language, primary_concern, symptom_duration,
            symptom_triggers, pain_level, chronic_conditions, past_surgeries, medications, family_history,
            diet, substance_use, physical_activity, menstrual_cycle, pregnancy_status, 
            mental_health, sleep_concerns
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *;
      `;

    const values = [
      patientId,
      allergies,
      primaryLanguage,
      preferredLanguage,
      primaryConcern,
      symptomDuration,
      symptomTriggers,
      painLevel,
      chronicConditions,
      pastSurgeries,
      medications,
      familyHistory,
      diet,
      substanceUse,
      physicalActivity,
      menstrualCycle,
      pregnancyStatus,
      mentalHealth,
      sleepConcerns,
    ];

    const result = await pool.query(insertQuery, values);
    res.json({
      message: "Health questionnaire submitted successfully!",
      questionnaire: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving health questionnaire:", error);
    res.status(500).json({ error: "Failed to submit health questionnaire." });
  }
});

// Fetch returning patient data
app.get("/api/returning-patient/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE email = $1;",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching patient data:", error);
    res.status(500).json({ error: "Failed to retrieve patient data" });
  }
});

// Update an existing patient
app.put(
  "/api/update-patient/:id",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, gender, age, phoneNumber, email, address } =
      req.body;

    try {
      const updateQuery = `
      UPDATE patients
      SET first_name = $1, last_name = $2, gender = $3, age = $4, phone_number = $5, email = $6, address = $7
      WHERE id = $8 RETURNING *;
    `;
      const values = [
        firstName,
        lastName,
        gender,
        age,
        phoneNumber,
        email,
        address,
        id,
      ];
      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.json({
        message: "Patient updated successfully!",
        patient: result.rows[0],
      });
    } catch (error) {
      console.error("Error updating patient:", error);
      res.status(500).json({ error: "Failed to update patient." });
    }
  }
);

//Group Patient Registration
app.post("/api/register-family", async (req, res) => {
  try {
    const { primaryMember, familyMembers } = req.body;

    // Debugging: Log received data
    console.log("📥 Received Family Registration Request:", req.body);

    // Validation: Ensure required data exists
    if (
      !primaryMember ||
      !primaryMember.firstName ||
      !primaryMember.lastName ||
      !primaryMember.email
    ) {
      console.error("❌ Missing Primary Member Data:", primaryMember);
      return res
        .status(400)
        .json({ error: "Primary member details are incomplete." });
    }

    if (!Array.isArray(familyMembers) || familyMembers.length === 0) {
      console.error("❌ No Family Members Provided:", familyMembers);
      return res
        .status(400)
        .json({ error: "At least one family member must be added." });
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
        const groupResult = await pool.query(
          "INSERT INTO family_groups DEFAULT VALUES RETURNING id;"
        );
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
      const groupResult = await pool.query(
        "INSERT INTO family_groups DEFAULT VALUES RETURNING id;"
      );
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
        primaryMember.phoneNumber || "",
        primaryMember.email,
        primaryMember.address || "",
        familyGroupId,
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
        console.warn(
          `⚠️ Family Member with email ${member.email} already exists. Skipping.`
        );
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
        member.phoneNumber || "",
        member.email,
        member.address || "",
        familyGroupId,
      ];

      await pool.query(familyInsert, familyValues);
      console.log(
        `✅ Family Member Registered: ${member.firstName} ${member.lastName}`
      );
    }

    res.json({
      message: "Family registered successfully!",
      familyGroupId,
    });
  } catch (error) {
    console.error("❌ Error registering family:", error);
    res.status(500).json({
      error: "Failed to register family. See server logs for details.",
    });
  }
});

//Fetch family groups with email
app.get("/api/family-group/:email", async (req, res) => {
  const { email } = req.params;

  try {
    // Fetch the primary member
    const primaryMemberResult = await pool.query(
      `SELECT * FROM patients WHERE email = $1;`,
      [email]
    );

    if (primaryMemberResult.rows.length === 0) {
      return res.status(404).json({ error: "Primary member not found" });
    }

    const primaryMember = primaryMemberResult.rows[0];
    const familyGroupId = primaryMember.family_group_id;

    if (!familyGroupId) {
      return res
        .status(404)
        .json({ error: "No family group associated with this member" });
    }

    // Fetch all members in the family group
    const familyMembersResult = await pool.query(
      `SELECT * FROM patients WHERE family_group_id = $1;`,
      [familyGroupId]
    );

    res.json({
      primaryMember,
      familyMembers: familyMembersResult.rows,
    });
  } catch (error) {
    console.error("Error fetching family group:", error);
    res.status(500).json({ error: "Failed to fetch family group" });
  }
});

// Update a family group member (Only Doctor or Admin)
app.put(
  "/api/family-group/update-member/:id",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, phone, email, address } = req.body;

    console.log("🔹 Received update request:", req.body);

    if (!firstName || !lastName || !phone || !email || !address) {
      console.error("❌ Missing required fields:", req.body);
      return res.status(400).json({ error: "All fields must be filled." });
    }

    try {
      const updateQuery = `
        UPDATE patients
        SET first_name = $1, last_name = $2, phone_number = $3, email = $4, address = $5
        WHERE id = $6 RETURNING *;
      `;

      const values = [firstName, lastName, phone, email, address, id];

      const result = await pool.query(updateQuery, values);

      if (result.rowCount === 0) {
        console.error("❌ No family member found for ID:", id);
        return res.status(404).json({ error: "Family member not found" });
      }

      res.json({
        message: "Family member updated successfully!",
        member: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Error updating family member:", error);
      res.status(500).json({ error: "Failed to update family member." });
    }
  }
);

// Remove a family member from the group (Only Doctor or Admin)
app.delete(
  "/api/family-group/remove-member/:id",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    const { id } = req.params;

    try {
      const deleteQuery = `DELETE FROM patients WHERE id = $1 RETURNING *;`;
      const result = await pool.query(deleteQuery, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Family member not found" });
      }

      res.json({
        message: "Family member removed successfully",
        member: result.rows[0],
      });
    } catch (error) {
      console.error("Error removing family member:", error);
      res.status(500).json({ error: "Failed to remove family member" });
    }
  }
);

//Fetch all Doctors
app.get("/api/doctors", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    // ✅ Fetch all doctors
    const result = await pool.query("SELECT * FROM doctors ORDER BY id ASC");

    if (result.rows.length === 0) {
      console.warn("⚠️ No doctors found in the database.");
      return res.status(200).json([]); // Return an empty array if no doctors exist
    }

    console.log("✅ Doctors retrieved from database:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching doctors:", error);
    res.status(500).json({ error: "Failed to fetch doctors." });
  }
});


//Add a doctor
app.post("/api/doctors", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { firstName, lastName, email, phoneNumber, specialty, password } = req.body;

  console.log("🔹 Received doctor registration request:", req.body); // Debugging

  if (!firstName || !lastName || !email || !specialty || !password) {
    console.error("❌ Missing required fields");
    return res.status(400).json({ error: "All fields, including password, are required." });
  }

  try {
    // ✅ Check if email already exists
    const existingDoctor = await pool.query("SELECT * FROM doctors WHERE email = $1", [email]);
    if (existingDoctor.rows.length > 0) {
      console.warn(`⚠️ Doctor with email ${email} already exists.`);
      return res.status(409).json({ error: "Doctor with this email already exists." });
    }

    // ✅ Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert doctor with encrypted password
    const result = await pool.query(
      `INSERT INTO doctors (first_name, last_name, email, phone_number, specialty, password)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [firstName, lastName, email, phoneNumber, specialty, hashedPassword]
    );

    console.log("✅ Doctor added successfully:", result.rows[0]);
    res.status(201).json({ message: "Doctor added successfully!", doctor: result.rows[0] });

  } catch (error) {
    console.error("❌ Error adding doctor:", error);
    res.status(500).json({ error: "Failed to add doctor." });
  }
});



//Fetch patients assigned to a doctor
app.get("/api/doctors/:doctorId/patients", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { doctorId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email FROM patients WHERE assigned_doctor_id = $1",
      [doctorId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching doctor’s patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

//Edit Doctor Details
app.put("/api/doctors/:id", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phoneNumber, specialty } = req.body;

  console.log(`🔹 Update request received for doctor ID: ${id}`, req.body); // Debugging

  try {
    // ✅ Check if the doctor exists
    const existingDoctor = await pool.query("SELECT * FROM doctors WHERE id = $1", [id]);
    if (existingDoctor.rows.length === 0) {
      console.warn(`⚠️ No doctor found with ID: ${id}`);
      return res.status(404).json({ error: "Doctor not found." });
    }

    console.log("🔍 Before Update: Doctor Data:", existingDoctor.rows[0]); // Debugging

    // ✅ Update the doctor's details
    const result = await pool.query(
      `UPDATE doctors 
       SET first_name = $1, last_name = $2, email = $3, phone_number = $4, specialty = $5
       WHERE id = $6 
       RETURNING *;`,
      [firstName, lastName, email, phoneNumber, specialty, id]
    );

    if (result.rowCount === 0) {
      console.error("❌ Update failed. No rows affected.");
      return res.status(500).json({ error: "Update failed." });
    }

    console.log("✅ Doctor updated successfully in DB:", result.rows[0]); // Debugging
    res.json({ message: "Doctor updated successfully", doctor: result.rows[0] });

  } catch (error) {
    console.error("❌ Error updating doctor:", error);
    res.status(500).json({ error: "Failed to update doctor." });
  }
});



//Remove a doctor
app.delete("/api/doctors/:id", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Delete request received for doctor ID: ${id}`); // Debugging

  try {
    // ✅ Check if the doctor exists before deleting
    const existingDoctor = await pool.query("SELECT * FROM doctors WHERE id = $1", [id]);
    if (existingDoctor.rows.length === 0) {
      console.warn(`⚠️ No doctor found with ID: ${id}`);
      return res.status(404).json({ error: "Doctor not found." });
    }

    console.log("🔍 Doctor found. Proceeding with deletion...");

    // ✅ Delete the doctor
    const result = await pool.query("DELETE FROM doctors WHERE id = $1 RETURNING *;", [id]);

    if (result.rowCount === 0) {
      console.error("❌ Deletion failed. No rows affected.");
      return res.status(500).json({ error: "Failed to delete doctor." });
    }

    console.log("✅ Doctor deleted successfully:", result.rows[0]);
    res.json({ message: "Doctor deleted successfully", doctor: result.rows[0] });

  } catch (error) {
    console.error("❌ Error deleting doctor:", error);
    res.status(500).json({ error: "Failed to delete doctor." });
  }
});


const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
