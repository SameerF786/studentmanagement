require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// 1. MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: ["http://localhost:5001", "http://127.0.0.1:5001"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// 2. HOME AND API STATUS

app.get("/", (req, res) => {
  res.json({
    message: "Student Management System Backend IS Running",
    port: PORT,
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "Correct server.js is running!" });
});

app.get("/api", (req, res) => {
  res.json({ message: "Student API is working" });
});

// ========================================
// 3. ADMIN LOGIN
// ========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");

      return res.status(500).json({
        message: "Server authentication configuration is missing",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" },
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed due to a server error",
    });
  }
});

// ========================================
// 4. GET ALL STUDENTS


app.get("/api/students", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students ORDER BY id DESC");

    return res.json(result.rows);
  } catch (error) {
    console.error("Fetch students error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch students",
    });
  }
});

// ========================================
// 5. GET STUDENT BY ID
// ========================================

app.get("/api/students/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const result = await pool.query("SELECT * FROM students WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Get student error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch student",
    });
  }
});

// ========================================
// 6. REGISTER STUDENT
// ========================================

app.post("/api/students", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      gender,
      mobile,
      email,
      course,
      year,
      college,
      address,
      city,
      state,
      pincode,
      guardianName,
      guardianMobile,
      guardianEmail,
      name,
    } = req.body || {};

    const finalFirstName =
      typeof firstName === "string" ? firstName.trim() : "";

    const finalLastName = typeof lastName === "string" ? lastName.trim() : "";

    const finalName =
      `${finalFirstName} ${finalLastName}`.trim() ||
      (typeof name === "string" ? name.trim() : "");

    if (
      !finalName ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof course !== "string" ||
      !course.trim() ||
      typeof city !== "string" ||
      !city.trim()
    ) {
      return res.status(400).json({
        message: "Name, email, course and city are required",
      });
    }

    if (dob && (typeof dob !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dob))) {
      return res.status(400).json({
        message: "Date of birth must use YYYY-MM-DD format",
      });
    }

    if (mobile && !/^\d{10}$/.test(String(mobile))) {
      return res.status(400).json({
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    if (guardianMobile && !/^\d{10}$/.test(String(guardianMobile))) {
      return res.status(400).json({
        message: "Guardian mobile must contain exactly 10 digits",
      });
    }

    if (pincode && !/^\d{6}$/.test(String(pincode))) {
      return res.status(400).json({
        message: "PIN code must contain exactly 6 digits",
      });
    }

    const result = await pool.query(
      `INSERT INTO students (
        first_name,
        last_name,
        dob,
        gender,
        mobile,
        name,
        email,
        course,
        study_year,
        college,
        address,
        city,
        state,
        pincode,
        guardian_name,
        guardian_mobile,
        guardian_email
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *`,
      [
        finalFirstName || null,
        finalLastName || null,
        dob || null,
        gender || null,
        mobile ? String(mobile) : null,
        finalName,
        email.trim(),
        course.trim(),
        year || null,
        college || null,
        address || null,
        city.trim(),
        state || null,
        pincode ? String(pincode) : null,
        guardianName || null,
        guardianMobile ? String(guardianMobile) : null,
        guardianEmail || null,
      ],
    );

    return res.status(201).json({
      message: "Student registered successfully!",
      student: result.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    if (error.code === "42703" || error.code === "42P01") {
      return res.status(500).json({
        message:
          "Database table or column is missing. Check your students table schema.",
      });
    }

    return res.status(500).json({
      message: "Unable to register student",
    });
  }
});

// ========================================
// 7. UPDATE STUDENT
// ========================================

app.put("/api/students/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, course, city } = req.body || {};

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    if (
      ![name, email, course, city].every(
        (value) => typeof value === "string" && value.trim().length > 0,
      )
    ) {
      return res.status(400).json({
        message: "Name, email, course and city are required",
      });
    }

    const result = await pool.query(
      `UPDATE students
       SET name = $1,
           email = $2,
           course = $3,
           city = $4
       WHERE id = $5
       RETURNING *`,
      [name.trim(), email.trim(), course.trim(), city.trim(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json({
      message: "Student updated successfully!",
      student: result.rows[0],
    });
  } catch (error) {
    console.error("Update student error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    return res.status(500).json({
      message: "Unable to update student",
    });
  }
});

// ========================================
// 8. DELETE STUDENT
// ========================================

app.delete("/api/students/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid student ID",
      });
    }

    const result = await pool.query(
      "DELETE FROM students WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    return res.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error.message);

    return res.status(500).json({
      message: "Unable to delete student",
    });
  }
});

// ========================================
// 9. HANDLE UNKNOWN API ROUTES
// ========================================

app.use((req, res) => {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ========================================
// 10. START SERVER
// ========================================

async function startServer() {
  try {
    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log("PostgreSQL connected successfully");
      console.log("Frontend allowed: http://localhost:5001");
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
