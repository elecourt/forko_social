const mysql = require("mysql2/promise")
require("dotenv").config()

async function setupDatabase() {
  console.log("🔧 Configuration de la base de données MySQL...")

  // Connexion sans spécifier de base de données pour la créer
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  })

  try {
    // Créer la base de données si elle n'existe pas
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "forko_social"}`)
    console.log(`✅ Base de données '${process.env.DB_NAME || "forko_social"}' créée ou vérifiée`)

    await connection.end()
    console.log("✅ Configuration terminée")
  } catch (error) {
    console.error("❌ Erreur lors de la configuration:", error.message)
    await connection.end()
    process.exit(1)
  }
}

setupDatabase()
