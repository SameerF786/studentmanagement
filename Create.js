require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createUser() {
  try {
    const name = "Admin";
    const email = "admin@gmail.com";
    const password = "Admin@123";

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password`,
      [name, email, hashedPassword],
    );

    console.log("Admin user created successfully!");
    console.log("Email: admin@gmail.com");
    console.log("Password: Admin@123");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createUser();
