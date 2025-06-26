const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" })
    }

    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" })
    }

    const user = users[0]

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Identifiants incorrects" })
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    })

    const { password: _, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.get("/me", authenticateToken, (req, res) => {
  res.json(req.user)
})

router.put("/me", authenticateToken, async (req, res) => {
  const { firstName, lastName, position, region } = req.body
  const userId = req.user.id

  try {
    await pool.execute(
      "UPDATE users SET firstName = ?, lastName = ?, position = ?, region = ? WHERE id = ?",
      [firstName, lastName, position, region, userId]
    )

    const [updatedUsers] = await pool.execute(
      "SELECT id, email, firstName, lastName, position, region, avatar, isAdmin FROM users WHERE id = ?",
      [userId]
    )

    res.status(200).json(updatedUsers[0])
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.post("/logout", (req, res) => {
  res.clearCookie("auth-token")
  res.json({ message: "Déconnexion réussie" })
})

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token et mot de passe requis" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM password_resets WHERE token = ? AND expiresAt > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    const resetEntry = rows[0];

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, resetEntry.userId]
    );

    await pool.execute(
      "DELETE FROM password_resets WHERE token = ?",
      [token]
    );

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur reset password:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router
