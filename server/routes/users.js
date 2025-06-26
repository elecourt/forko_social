const express = require("express")
const bcrypt = require("bcryptjs")
const { pool } = require("../config/database")
const { authenticateToken, requireAdmin } = require("../middleware/auth")
const { sendInvitationEmail } = require("../utils/email") // fonction d'envoi d'e-mail à créer
const { v4: uuidv4 } = require("uuid")

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { region } = req.query

    let query = `
      SELECT id, email, firstName, lastName, position, location, region, avatar, isAdmin, createdAt
      FROM users
    `
    const params = []

    if (region && region.trim() !== "") {
      query += " WHERE region = ?"
      params.push(region)
    }

    query += " ORDER BY firstName, lastName"

    const [users] = await pool.execute(query, params)
    res.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id, email, firstName, lastName, position, location, region, avatar, isAdmin, createdAt FROM users WHERE id = ?",
      [req.params.id],
    )

    if (users.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    res.json(users[0])
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== ""
}

router.post("/", async (req, res) => {
  try {
    const { email, firstName, lastName, position, location, region } = req.body;
    const userId = uuidv4();  

    const [existingUsers] = await pool.execute("SELECT id FROM users WHERE email = ?", [email.trim()]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Un utilisateur avec cet email existe déjà" });
    }

    await pool.execute(
      `INSERT INTO users (id, email, firstName, lastName, position, location, region)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, email.trim(), firstName.trim(), lastName.trim(), position.trim(), location.trim(), region.trim()]
    );

    const token = uuidv4();
    const expiration = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await pool.execute(
      `INSERT INTO password_resets (userId, token, expiresAt) VALUES (?, ?, ?)`,
      [userId, token, expiration]
    );

    await sendInvitationEmail(email, token);

    const [newUsers] = await pool.execute(
      `SELECT id, email, firstName, lastName, position, location, region, avatar, isAdmin, createdAt 
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(201).json(newUsers[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id
    const { firstName, lastName, position, location, region, avatar } = req.body

    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: "Non autorisé" })
    }

    const avatarValue = avatar && avatar.trim() !== "" ? avatar.trim() : null

    const [result] = await pool.execute(
      `UPDATE users 
       SET firstName = ?, lastName = ?, position = ?, location = ?, region = ?, avatar = ?
       WHERE id = ?`,
      [firstName.trim(), lastName.trim(), position.trim(), location.trim(), region.trim(), avatarValue, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" })
    }

    const [users] = await pool.execute(
      "SELECT id, email, firstName, lastName, position, location, region, avatar, isAdmin, createdAt FROM users WHERE id = ?",
      [userId],
    )

    res.json(users[0])
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.delete("/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


module.exports = router
