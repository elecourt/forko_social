const express = require("express")
const { pool } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const [conversations] = await pool.execute(
      `
      SELECT DISTINCT
        c.id,
        c.createdAt,
        c.updatedAt,
        m.content as lastMessageContent,
        m.createdAt as lastMessageDate,
        m.senderId as lastMessageSenderId,
        u.id as otherUserId,
        u.firstName,
        u.lastName,
        u.avatar,
        u.position,
        COUNT(CASE WHEN m2.isRead = FALSE AND m2.senderId != ? THEN 1 END) as unreadCount
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversationId
      JOIN conversation_participants cp2 ON c.id = cp2.conversationId AND cp2.userId != ?
      JOIN users u ON cp2.userId = u.id
      LEFT JOIN messages m ON c.id = m.conversationId
      LEFT JOIN messages m2 ON c.id = m2.conversationId
      WHERE cp.userId = ?
        AND (m.id IS NULL OR m.createdAt = (
          SELECT MAX(createdAt) 
          FROM messages 
          WHERE conversationId = c.id
        ))
      GROUP BY c.id, u.id, m.id
      ORDER BY COALESCE(m.createdAt, c.createdAt) DESC
    `,
      [req.user.id, req.user.id, req.user.id],
    )

    const formattedConversations = conversations.map((conv) => ({
      id: conv.id,
      participants: [
        {
          id: conv.otherUserId,
          firstName: conv.firstName,
          lastName: conv.lastName,
          avatar: conv.avatar,
          position: conv.position,
        },
      ],
      lastMessage: conv.lastMessageContent
        ? {
            content: conv.lastMessageContent,
            createdAt: conv.lastMessageDate,
            senderId: conv.lastMessageSenderId,
          }
        : {
            content: "Conversation créée",
            createdAt: conv.createdAt,
            senderId: req.user.id,
          },
      unreadCount: Number.parseInt(conv.unreadCount) || 0,
    }))

    res.json(formattedConversations)
  } catch (error) {
    console.error("Get conversations error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id

    const [participants] = await pool.execute(
      "SELECT userId FROM conversation_participants WHERE conversationId = ? AND userId = ?",
      [conversationId, req.user.id],
    )

    if (participants.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé à cette conversation" })
    }

    const [messages] = await pool.execute(
      `
      SELECT 
        m.*,
        u.firstName,
        u.lastName,
        u.avatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt ASC
    `,
      [conversationId],
    )

    await pool.execute("UPDATE messages SET isRead = TRUE WHERE conversationId = ? AND senderId != ?", [
      conversationId,
      req.user.id,
    ])

    res.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body

    if (!receiverId) {
      return res.status(400).json({ error: "Destinataire requis" })
    }

    const [receiverCheck] = await pool.execute("SELECT id FROM users WHERE id = ?", [receiverId])
    if (receiverCheck.length === 0) {
      return res.status(400).json({ error: "Destinataire introuvable" })
    }

    const [conversations] = await pool.execute(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversationId
      JOIN conversation_participants cp2 ON c.id = cp2.conversationId
      WHERE cp1.userId = ? AND cp2.userId = ?
    `,
      [req.user.id, receiverId],
    )

    if (conversations.length > 0) {
      return res.status(200).json({ conversationId: conversations[0].id })
    }

    const [result] = await pool.execute("INSERT INTO conversations () VALUES ()")

    const [newConversation] = await pool.execute("SELECT id FROM conversations WHERE id = LAST_INSERT_ID()")

    if (!newConversation || newConversation.length === 0) {
      return res.status(500).json({ error: "Erreur lors de la création de la conversation" })
    }

    const conversationId = newConversation[0].id

    console.log("Created conversation with ID:", conversationId)

    await pool.execute("INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?), (?, ?)", [
      conversationId,
      req.user.id,
      conversationId,
      receiverId,
    ])

    res.status(201).json({ conversationId })
  } catch (error) {
    console.error("Create conversation error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body

    if (!receiverId || !content || content.trim() === "") {
      return res.status(400).json({ error: "Destinataire et contenu requis" })
    }

    const [receiverCheck] = await pool.execute("SELECT id FROM users WHERE id = ?", [receiverId])
    if (receiverCheck.length === 0) {
      return res.status(400).json({ error: "Destinataire introuvable" })
    }

    const [conversations] = await pool.execute(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversationId
      JOIN conversation_participants cp2 ON c.id = cp2.conversationId
      WHERE cp1.userId = ? AND cp2.userId = ?
    `,
      [req.user.id, receiverId],
    )

    let conversationId

    if (conversations.length === 0) {
      const [result] = await pool.execute("INSERT INTO conversations () VALUES ()")

      const [newConversation] = await pool.execute("SELECT LAST_INSERT_ID() as id")

      if (!newConversation || newConversation.length === 0) {
        return res.status(500).json({ error: "Erreur lors de la création de la conversation" })
      }

      const [conversationData] = await pool.execute("SELECT id FROM conversations WHERE id = ?", [
        newConversation[0].id,
      ])

      if (!conversationData || conversationData.length === 0) {
        return res.status(500).json({ error: "Conversation introuvable après création" })
      }

      conversationId = conversationData[0].id

      console.log("Created conversation with ID:", conversationId)

      await pool.execute("INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?), (?, ?)", [
        conversationId,
        req.user.id,
        conversationId,
        receiverId,
      ])
    } else {
      conversationId = conversations[0].id
    }

    const [messageResult] = await pool.execute(
      "INSERT INTO messages (conversationId, senderId, content) VALUES (?, ?, ?)",
      [conversationId, req.user.id, content.trim()],
    )

    const [messages] = await pool.execute(
      `
      SELECT 
        m.*,
        u.firstName,
        u.lastName,
        u.avatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.id = ?
    `,
      [messageResult.insertId],
    )

    const message = {
      ...messages[0],
      conversationId: conversationId,
    }

    if (req.app.get("io")) {
      req.app.get("io").to(`user_${receiverId}`).emit("new_message", message)
    }

    res.status(201).json({ message, conversationId })
  } catch (error) {
    console.error("Send message error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

module.exports = router
