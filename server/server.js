const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const translate = require('@vitalets/google-translate-api');
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
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

pool
  .connect()
  .then(() => console.log("Connected to YugabyteDB"))
  .catch((err) => console.error("YugabyteDB connection error:", err));
//test to fix 
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
        CREATE TABLE IF NOT EXISTS doctors (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(255),
          specialty VARCHAR(255),
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INT,                 -- ID of the user performing the action
          action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE'
          entity VARCHAR(50) NOT NULL, -- e.g., 'patient', 'doctor'
          entity_id INT NOT NULL,      -- The ID of the affected record
          old_data JSONB,              -- JSON snapshot before change (if applicable)
          new_data JSONB,              -- JSON snapshot after change (if applicable)
          metadata JSONB               -- Additional context (e.g., IP address, session info)
        );
      `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS health_questions (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            category TEXT NOT NULL,
            field_name TEXT UNIQUE NOT NULL,
            options TEXT[], -- Stored as a JSON stringified array
            parent_question_id INT REFERENCES health_questions(id) ON DELETE CASCADE,
            trigger_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
      `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS patient_responses (
          id SERIAL PRIMARY KEY,
          patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
          field_name TEXT NOT NULL REFERENCES health_questions(field_name),
          answer TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

    // Create default Admin user
    await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, role, is_verified)
        VALUES ('Admin', 'User', 'admin@email.com', '${await bcrypt.hash(
      "pass",
      10
    )}', 'Admin', TRUE)
        ON CONFLICT (email) DO NOTHING;
      `);
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password, role, is_verified)
      VALUES ('Volunteer', 'User', 'volunteer@v.com', '${await bcrypt.hash(
      "volunteer",
      10
    )}', 'Volunteer', TRUE)
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log("✅ Tables are ready.");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  }
};

createTables();

/** EVENT LOGs APIs & Functions FOR ADMIN DASHBOARD -- Logs an audit event to the audit_logs table.
 */
async function logEvent({
  user_id = null,
  action,
  entity,
  entity_id,
  old_data = null,
  new_data = null,
  metadata = null,
}) {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [
      user_id,
      action,
      entity,
      entity_id,
      old_data,
      new_data,
      metadata,
    ];
    await pool.query(query, values);
    console.log(
      `Audit log recorded: ${action} on ${entity} with ID ${entity_id}`
    );
  } catch (error) {
    console.error("Error recording audit log:", error);
    // Error in logging shouldn't block main operations.
  }
}

/**
 *  Authentication APIs
 */

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



// Get Audit Logs API for Admin Dash
app.get(
  "/api/audit-logs",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const result = await pool.query(`
      SELECT a.*, 
        COALESCE(u.first_name || ' ' || u.last_name, 'N/A') AS user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC;
    `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
);

// Patient Registration
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

    // Add audit logging for patient creation
    logEvent({
      user_id: null,
      action: "CREATE",
      entity: "patient",
      entity_id: result.rows[0].id,
      old_data: null,
      new_data: result.rows[0],
      metadata: { endpoint: "register-patient" },
    });

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
    // Always query the users table
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT using the user table's id and role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Error logging in" });
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
      // Fetch the current state before the update for audit purposes
      const oldDataResult = await pool.query(
        "SELECT * FROM patients WHERE id = $1",
        [id]
      );
      const oldData = oldDataResult.rows[0];

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

      // audit logging for patient update
      logEvent({
        user_id: req.user.id, // Authenticated user performing the update
        action: "UPDATE",
        entity: "patient",
        entity_id: id,
        old_data: oldData,
        new_data: result.rows[0],
        metadata: { endpoint: "update-patient" },
      });

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
      const primaryResult = await pool.query(primaryInsert, primaryValues);
      console.log("✅ Primary Member Registered:", primaryMember.email);

      // Audit log for primary member creation
      logEvent({
        user_id: null,
        action: "CREATE",
        entity: "patient",
        entity_id: primaryResult.rows[0].id,
        old_data: null,
        new_data: primaryResult.rows[0],
        metadata: { endpoint: "POST /api/register-family - primary" },
      });
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

      const familyResult = await pool.query(
        "SELECT * FROM patients WHERE email = $1;",
        [member.email]
      );
      if (familyResult.rows.length > 0) {
        logEvent({
          user_id: null,
          action: "CREATE",
          entity: "patient",
          entity_id: familyResult.rows[0].id,
          old_data: null,
          new_data: familyResult.rows[0],
          metadata: { endpoint: "POST /api/register-family - family" },
        });
      }
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

// Get all questions
app.get("/api/questions", async (req, res) => {
  const lang = req.query.lang || "en"; // default to English if no lang is provided

  try {
    const result = await pool.query("SELECT * FROM health_questions ORDER BY id ASC");

    // If English is requested, skip translation
    if (lang === "en") {
      return res.json(result.rows);
    }

    // Translate each question and its options
    const translated = await Promise.all(
      result.rows.map(async (q) => {
        const translatedQuestion = await translate(q.question, { to: lang });
        const translatedOptions = q.options
          ? await Promise.all(q.options.map(opt => translate(opt, { to: lang }).then(r => r.text)))
          : [];

        return {
          ...q,
          question: translatedQuestion.text,
          options: translatedOptions
        };
      })
    );

    res.json(translated);
  } catch (error) {
    console.error("Error fetching or translating questions:", error);
    res.status(500).json({ error: "Failed to fetch or translate questions" });
  }
});

// Create a new question (admin only)
app.post("/api/questions", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { question, category, field_name, options, parent_question_id, trigger_value } = req.body;

  if (!question || !category || !field_name || !options) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const insertQuery = `
      INSERT INTO health_questions (question, category, field_name, options, parent_question_id, trigger_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    let optionsArray = Array.isArray(options)
      ? options
      : options.split(",").map(opt => opt.trim());

    const values = [
      question,
      category,
      field_name,
      `{${optionsArray.join(",")}}`, // This now works as expected
      parent_question_id || null,
      trigger_value || null
    ];

    const result = await pool.query(insertQuery, values);
    res.json({ message: "Question added successfully!", question: result.rows[0] });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
});

// Update a question (admin only)
app.put("/api/questions/:id", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { id } = req.params;
  const { question, category, field_name, options, parent_question_id, trigger_value } = req.body;

  try {
    const updateQuery = `
      UPDATE health_questions 
      SET question = $1, category = $2, field_name = $3, options = $4, parent_question_id = $5, trigger_value = $6
      WHERE id = $7 RETURNING *;
    `;
    let optionsArray = Array.isArray(options)
      ? options
      : options.split(",").map(opt => opt.trim());

    const values = [
      question,
      category,
      field_name,
      `{${optionsArray.join(",")}}`, // match CREATE format
      parent_question_id || null,
      trigger_value || null,
      id
    ];
    const result = await pool.query(updateQuery, values);
    res.json({ message: "Question updated successfully!", question: result.rows[0] });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete a question (Admin only)
app.delete("/api/questions/:id", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM health_questions WHERE id = $1;", [id]);
    res.json({ message: "Question deleted successfully!" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Failed to delete question" });
  }
});

app.post("/api/submit-health-questionnaire", async (req, res) => {
  const { patientId, ...answers } = req.body;

  if (!patientId || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: "Patient ID and answers are required." });
  }

  try {
    // Optional: Remove previous answers if re-submitting
    await pool.query("DELETE FROM patient_responses WHERE patient_id = $1", [patientId]);

    const insertQuery = ` 
      INSERT INTO patient_responses (patient_id, field_name, answer)
      VALUES ($1, $2, $3)
    `;

    for (const [field_name, answer] of Object.entries(answers)) {
      await pool.query(insertQuery, [patientId, field_name, answer]);
    }

    res.status(201).json({ message: "Health questionnaire submitted successfully!" });
  } catch (error) {
    console.error("Error submitting questionnaire:", error);
    res.status(500).json({ error: "Failed to submit questionnaire." });
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
      const oldDataResult = await pool.query(
        "SELECT * FROM patients WHERE id = $1",
        [id]
      );
      const oldData = oldDataResult.rows[0];

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

      // Audit log for family member update
      logEvent({
        user_id: req.user.id,
        action: "UPDATE",
        entity: "patient",
        entity_id: id,
        old_data: oldData,
        new_data: result.rows[0],
        metadata: { endpoint: "PUT /api/family-group/update-member/:id" },
      });

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
      const oldDataResult = await pool.query(
        "SELECT * FROM patients WHERE id = $1",
        [id]
      );
      const oldData = oldDataResult.rows[0];

      const deleteQuery = `DELETE FROM patients WHERE id = $1 RETURNING *;`;
      const result = await pool.query(deleteQuery, [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Family member not found" });
      }

      // Audit log for family member deletion
      logEvent({
        user_id: req.user.id,
        action: "DELETE",
        entity: "patient",
        entity_id: id,
        old_data: oldData,
        new_data: null,
        metadata: { endpoint: "DELETE /api/family-group/remove-member/:id" },
      });

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

/**
 *  ADMIN ENDPOINTS -- Doctor APIS
 */

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

//  Fetch/Read all Doctors
app.get(
  "/api/doctors",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
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
  }
);

//  Create Doctor
app.post(
  "/api/doctors",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
    const { firstName, lastName, email, phoneNumber, specialty, password } =
      req.body;

    if (!firstName || !lastName || !email || !specialty || !password) {
      return res
        .status(400)
        .json({ error: "All fields, including password, are required." });
    }

    try {
      // Check if a doctor (or user) with this email already exists in either table
      const existingUser = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "A user with this email already exists." });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction
      await pool.query("BEGIN");

      // 1) Insert into `users` with role 'Doctor'
      const userResult = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, role, is_verified)
       VALUES ($1, $2, $3, $4, 'Doctor', TRUE)
       RETURNING id;`,
        [firstName, lastName, email, hashedPassword]
      );
      const newUserId = userResult.rows[0].id;

      // 2) Insert into `doctors`, referencing `user_id`
      const doctorResult = await pool.query(
        `INSERT INTO doctors (user_id, first_name, last_name, email, phone_number, specialty, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
        [
          newUserId,
          firstName,
          lastName,
          email,
          phoneNumber,
          specialty,
          hashedPassword,
        ]
      );

      // Commit transaction
      await pool.query("COMMIT");

      // Audit log
      logEvent({
        user_id: req.user.id, // The Admin performing this creation
        action: "CREATE",
        entity: "doctor",
        entity_id: doctorResult.rows[0].id,
        old_data: null,
        new_data: doctorResult.rows[0],
        metadata: { endpoint: "POST /api/doctors" },
      });

      res.status(201).json({
        message: "Doctor added successfully!",
        doctor: doctorResult.rows[0],
        userId: newUserId,
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      console.error("❌ Error adding doctor:", error);
      res.status(500).json({ error: "Failed to add doctor." });
    }
  }
);

// Fetch patients assigned to a doctor
app.get(
  "/api/doctors/:doctorId/patients",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
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
  }
);

// Update Doctor Details
app.put(
  "/api/doctors/:id",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, specialty } = req.body;

    console.log(`🔹 Update request received for doctor ID: ${id}`, req.body); // Debugging

    try {
      // ✅ Check if the doctor exists
      const existingDoctor = await pool.query(
        "SELECT * FROM doctors WHERE id = $1",
        [id]
      );
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

      // Audit log for doctor update
      logEvent({
        user_id: req.user.id,
        action: "UPDATE",
        entity: "doctor",
        entity_id: id,
        old_data: existingDoctor.rows[0],
        new_data: result.rows[0],
        metadata: { endpoint: "PUT /api/doctors/:id" },
      });

      res.json({
        message: "Doctor updated successfully",
        doctor: result.rows[0],
      });
    } catch (error) {
      console.error("❌ Error updating doctor:", error);
      res.status(500).json({ error: "Failed to update doctor." });
    }
  }
);

// Remove a doctor
app.delete(
  "/api/doctors/:id",
  authenticate,
  authorizeRoles("Admin"),
  async (req, res) => {
    const { id } = req.params;

    console.log(`Delete request received for doctor ID: ${id}`);

    try {
      const existingDoctor = await pool.query(
        "SELECT * FROM doctors WHERE id = $1",
        [id]
      );

      if (existingDoctor.rows.length === 0) {
        console.warn(` No doctor found with ID: ${id}`);
        return res.status(404).json({ error: "Doctor not found." });
      }

      console.log("Doctor found. Proceeding with deletion...");

      const doctor = existingDoctor.rows[0]; // Store doctor info

      const deleteUser = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING *;",
        [doctor.user_id]
      );

      if (deleteUser.rowCount === 0) {
        console.error("Failed to delete associated user.");
        return res.status(500).json({ error: "Failed to delete associated user." });
      }

      console.log("Associated user deleted successfully:", deleteUser.rows[0]);

      logEvent({
        user_id: req.user.id,
        action: "DELETE",
        entity: "doctor",
        entity_id: id,
        old_data: doctor,
        new_data: null,
        metadata: { endpoint: "DELETE /api/doctors/:id" },
      });

      res.json({
        message: "Doctor and associated user deleted successfully",
        user: deleteUser.rows[0],
      });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      res.status(500).json({ error: "Failed to delete doctor." });
    }
  }
);

/**
 * ============================
 * Doctor Dashboard Endpoints
 * ============================
 */

/**
 * GET /api/patients
 *
 * Returns a list of patients, optionally filtered by query parameters:
 *   - firstName
 *   - lastName
 *   - email
 *   - phoneNumber
 *   - familyGroupId
 *   - assignedDoctorId
 *
 * Accessible to users with role "Doctor" or "Admin".
 */
app.get(
  "/api/patients",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      familyGroupId,
      assignedDoctorId,
    } = req.query;
    try {
      const query = `
      SELECT * FROM patients
      WHERE 
        ($1::text IS NULL OR first_name ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR last_name ILIKE '%' || $2 || '%')
        AND ($3::text IS NULL OR email ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR phone_number ILIKE '%' || $4 || '%')
        AND ($5::int IS NULL OR family_group_id = $5)
        AND ($6::int IS NULL OR assigned_doctor_id = $6)
      ORDER BY id ASC;
    `;
      const values = [
        firstName || null,
        lastName || null,
        email || null,
        phoneNumber || null,
        familyGroupId ? parseInt(familyGroupId) : null,
        assignedDoctorId ? parseInt(assignedDoctorId) : null,
      ];
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  }
);

/**
 * PUT /api/patients/:id/assign-doctor
 *
 * Updates the `assigned_doctor_id` for a patient.
 * - If the current (old) assignment is null (i.e. the first assignment),
 *   no audit log is created.
 * - If the patient already has an assignment (non-null) and it changes,
 *   an UPDATE event is logged.
 *
 * Accessible to users with role "Doctor" or "Admin".
 */
app.put(
  "/api/patients/:id/assign-doctor",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    const { id } = req.params; // Patient ID from URL
    const { assignedDoctorId } = req.body; // New doctor assignment

    if (!assignedDoctorId) {
      return res.status(400).json({ error: "Assigned doctor ID is required" });
    }

    try {
      // Retrieve the current patient record
      const patientResult = await pool.query(
        "SELECT * FROM patients WHERE id = $1",
        [id]
      );
      if (patientResult.rowCount === 0) {
        return res.status(404).json({ error: "Patient not found" });
      }
      const patient = patientResult.rows[0];
      const oldAssignment = patient.assigned_doctor_id;

      // Update the assigned_doctor_id
      const updateQuery = `
      UPDATE patients
      SET assigned_doctor_id = $1
      WHERE id = $2
      RETURNING *;
    `;
      const updateResult = await pool.query(updateQuery, [
        assignedDoctorId,
        id,
      ]);
      const updatedPatient = updateResult.rows[0];

      // Log an audit event only if the patient had an existing assignment (non-null) that changed
      if (oldAssignment !== null && oldAssignment !== assignedDoctorId) {
        logEvent({
          user_id: req.user.id, // The doctor/admin performing the update
          action: "UPDATE",
          entity: "patient",
          entity_id: id,
          old_data: patient,
          new_data: updatedPatient,
          metadata: { endpoint: "PUT /api/patients/:id/assign-doctor" },
        });
      }

      res.json({
        message: "Doctor assignment updated successfully",
        patient: updatedPatient,
      });
    } catch (error) {
      console.error("Error updating doctor assignment:", error);
      res.status(500).json({ error: "Failed to update doctor assignment" });
    }
  }
);

/**
 * GET /api/doctors
 *
 * Returns a list of doctors. This endpoint can be used to populate a dropdown
 * for selecting a doctor to assign to a patient.
 *
 * Accessible to users with role "Doctor" or "Admin".
 */
app.get(
  "/api/doctorsList",
  authenticate,
  authorizeRoles("Doctor", "Admin"),
  async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM doctors ORDER BY id ASC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      res.status(500).json({ error: "Failed to fetch doctors" });
    }
  }
);

//Get the amount of audits and changes 
app.get("/api/metrics/audit-summary", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT action, COUNT(*) AS count
      FROM audit_logs
      GROUP BY action;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching audit log summary:", error);
    res.status(500).json({ error: "Failed to fetch audit log summary" });
  }
});

// app.get("/api/metrics/summary", authenticate, authorizeRoles("Admin"), async (req, res) => {
//   try {
//     const patientsResult = await pool.query("SELECT COUNT(*) AS total_patients FROM patients;");
//     const doctorsResult = await pool.query("SELECT COUNT(*) AS total_doctors FROM doctors;");
//     const familyResult = await pool.query("SELECT COUNT(*) AS total_family_groups FROM family_groups;");

//     res.json({
//       total_patients: patientsResult.rows[0].total_patients,
//       total_doctors: doctorsResult.rows[0].total_doctors,
//       total_family_groups: familyResult.rows[0].total_family_groups
//     });
//   } catch (error) {
//     console.error("Error fetching summary metrics:", error);
//     res.status(500).json({ error: "Failed to fetch summary metrics" });
//   }
// });

app.get("/api/metrics/doctor-performance", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.first_name, d.last_name, COUNT(p.id) AS patient_count
      FROM doctors d
      LEFT JOIN patients p ON d.id = p.assigned_doctor_id
      GROUP BY d.id
      ORDER BY patient_count DESC;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching doctor performance metrics:", error);
    res.status(500).json({ error: "Failed to fetch doctor performance metrics" });
  }
});

const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get("/api/reports/patient/:patientId", authenticate, authorizeRoles("Admin"), async (req, res) => {
  const { patientId } = req.params;

  try {
    const result = await pool.query(`
      SELECT p.id AS patient_id, p.age, p.gender, r.field_name, r.answer
      FROM patient_responses r
      JOIN patients p ON r.patient_id = p.id
      WHERE p.id = $1;
    `, [patientId]);

    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: "No responses found for this patient." });
    }

    const { age, gender } = rows[0];
    const responses = {};
    rows.forEach(({ field_name, answer }) => {
      responses[field_name] = answer;
    });

    const prompt = `
You are a healthcare assistant AI. Here's a health questionnaire from a rural patient:

- Age: ${age}
- Gender: ${gender}
- Symptoms: ${JSON.stringify(responses)}

Please summarize:
- Key reported symptoms
- Possible health concerns
- Suggestions for follow-up or care
    `;

    const groqRes = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
    });

    const report = groqRes.choices[0].message.content;
    res.json({ report });
  } catch (err) {
    console.error("GROQ patient report failed:", err);
    res.status(500).json({ error: "Failed to generate report for patient" });
  }
});
app.get("/api/reported-patients", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.id, p.email
      FROM patient_responses r
      JOIN patients p ON r.patient_id = p.id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reported patients:", err);
    res.status(500).json({ error: "Failed to fetch reported patients." });
  }
});


app.get("/api/metrics/summary", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    // Total counts
    const patientsResult = await pool.query("SELECT COUNT(*) AS total_patients FROM patients;");
    const doctorsResult = await pool.query("SELECT COUNT(*) AS total_doctors FROM doctors;");
    const familyResult = await pool.query("SELECT COUNT(*) AS total_family_groups FROM family_groups;");

    // Gender Distribution
    const genderResult = await pool.query(`
      SELECT gender, COUNT(*) AS count
      FROM patients
      GROUP BY gender;
    `);

    // Age Stats
    const ageAvgResult = await pool.query(`SELECT AVG(age)::INT AS average_age FROM patients;`);
    const ageGroupResult = await pool.query(`
      SELECT 
        CASE 
          WHEN age BETWEEN 0 AND 18 THEN '0-18'
          WHEN age BETWEEN 19 AND 35 THEN '19-35'
          WHEN age BETWEEN 36 AND 50 THEN '36-50'
          WHEN age BETWEEN 51 AND 65 THEN '51-65'
          ELSE '66+'
        END AS age_group,
        COUNT(*) AS count
      FROM patients
      GROUP BY age_group;
    `);

    // Patients per doctor
    const patientsPerDoctor = await pool.query(`
      SELECT 
        d.id, d.first_name || ' ' || d.last_name AS doctor_name, COUNT(p.id) AS patient_count
      FROM doctors d
      LEFT JOIN patients p ON d.id = p.assigned_doctor_id
      GROUP BY d.id
      ORDER BY patient_count DESC;
    `);

    // Unassigned patients
    const unassignedPatients = await pool.query(`
      SELECT COUNT(*) AS unassigned_patient_count
      FROM patients
      WHERE assigned_doctor_id IS NULL;
    `);

    // Questionnaire/Response Metrics
    const responseSummary = await pool.query(`
      SELECT COUNT(DISTINCT patient_id) AS total_responses
      FROM patient_responses;
    `);
    const topQuestions = await pool.query(`
      SELECT field_name, COUNT(*) AS answer_count
      FROM patient_responses
      GROUP BY field_name
      ORDER BY answer_count DESC
      LIMIT 10;
    `);

    // Audit log - changes over time
    const auditOverTime = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS changes
      FROM audit_logs
      GROUP BY date
      ORDER BY date DESC;
    `);

    // Audit log - most active users
    const topUsers = await pool.query(`
      SELECT COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS user_name, COUNT(a.id) AS actions
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      GROUP BY u.id
      ORDER BY actions DESC
      LIMIT 5;
    `);

    // Family group metrics
    const familySizeAvg = await pool.query(`
      SELECT ROUND(AVG(member_count), 2) AS avg_family_size
      FROM (
        SELECT family_group_id, COUNT(*) AS member_count
        FROM patients
        WHERE family_group_id IS NOT NULL
        GROUP BY family_group_id
      ) AS sub;
    `);

    res.json({
      totals: {
        total_patients: patientsResult.rows[0].total_patients,
        total_doctors: doctorsResult.rows[0].total_doctors,
        total_family_groups: familyResult.rows[0].total_family_groups,
      },
      demographics: {
        gender_distribution: genderResult.rows,
        average_age: ageAvgResult.rows[0].average_age,
        age_groups: ageGroupResult.rows
      },
      doctors: {
        patients_per_doctor: patientsPerDoctor.rows,
        unassigned_patients: unassignedPatients.rows[0].unassigned_patient_count
      },
      questionnaires: {
        total_responses: responseSummary.rows[0].total_responses,
        top_answered_questions: topQuestions.rows
      },
      audit_logs: {
        changes_over_time: auditOverTime.rows,
        top_users: topUsers.rows
      },
      families: {
        average_family_size: familySizeAvg.rows[0].avg_family_size
      }
    });
  } catch (error) {
    console.error("❌ Error fetching full summary metrics:", error);
    res.status(500).json({ error: "Failed to fetch summary metrics" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});