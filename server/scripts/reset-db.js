const { pool } = require("../config/database")

async function resetDatabase() {
  try {
    console.log("🗑️ Suppression des tables existantes...")

    // Désactiver les contraintes de clés étrangères temporairement
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0")

    // Supprimer toutes les tables
    const tables = [
      "messages",
      "conversation_participants",
      "conversations",
      "comments",
      "post_likes",
      "posts",
      "users",
    ]

    for (const table of tables) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS ${table}`)
        console.log(`✅ Table ${table} supprimée`)
      } catch (error) {
        console.log(`⚠️ Table ${table} n'existait pas`)
      }
    }

    // Réactiver les contraintes de clés étrangères
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1")

    console.log("✅ Base de données réinitialisée")
    process.exit(0)
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error)
    process.exit(1)
  }
}

resetDatabase()
