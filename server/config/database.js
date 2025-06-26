const mysql = require("mysql2/promise")
require("dotenv").config()

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "forko_social",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  collation: "utf8mb4_unicode_ci",
}

const pool = mysql.createPool(dbConfig)

async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ Connexion à la base de données réussie")

    const [rows] = await connection.execute("SELECT @@character_set_database, @@collation_database")
    console.log("📊 Charset:", rows[0])

    connection.release()
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error.message)
    process.exit(1)
  }
}

module.exports = { pool, testConnection }
