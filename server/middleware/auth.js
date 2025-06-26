const jwt = require("jsonwebtoken")
const { pool } = require("../config/database")

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies["auth-token"]

    if (!token) {
      return res.status(401).json({ error: "Token d'authentification requis" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const [users] = await pool.execute(
      "SELECT id, email, firstName, lastName, position, location, region, avatar, isAdmin FROM users WHERE id = ?",
      [decoded.userId],
    )

    if (users.length === 0) {
      return res.status(401).json({ error: "Utilisateur non trouvé" })
    }

    req.user = users[0]
    next()
  } catch (error) {
    console.error("Auth error:", error)
    return res.status(401).json({ error: "Token invalide" })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Accès administrateur requis" })
  }
  next()
}

module.exports = { authenticateToken, requireAdmin }
