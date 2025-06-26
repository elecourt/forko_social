const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

router.get("/existing", authenticateToken, async (req, res) => {
  const otherUserId = req.query.userId;
  if (!otherUserId) {
    return res.status(400).json({ error: "Paramètre userId requis" });
  }

  try {
    const [existing] = await pool.execute(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversationId
      JOIN conversation_participants cp2 ON c.id = cp2.conversationId
      WHERE cp1.userId = ? AND cp2.userId = ?
      `,
      [req.user.id, otherUserId]
    );

    if (existing.length > 0) {
      return res.status(200).json({ conversationId: existing[0].id });
    } else {
      return res.status(200).json({ conversationId: null });
    }
  } catch (error) {
    console.error("Erreur dans /conversations/existing:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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
      [userId, userId, userId]
    );

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
            senderId: userId,
          },
      unreadCount: Number.parseInt(conv.unreadCount) || 0,
    }));

    res.json(formattedConversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Destinataire requis" });
    }

    const [receiverCheck] = await pool.execute("SELECT id FROM users WHERE id = ?", [receiverId]);
    if (receiverCheck.length === 0) {
      return res.status(400).json({ error: "Destinataire introuvable" });
    }

    const [conversations] = await pool.execute(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversationId
      JOIN conversation_participants cp2 ON c.id = cp2.conversationId
      WHERE cp1.userId = ? AND cp2.userId = ?
      `,
      [req.user.id, receiverId]
    );

    if (conversations.length > 0) {
      return res.status(200).json({ conversationId: conversations[0].id });
    }

    const conversationId = uuidv4();

    await pool.execute("INSERT INTO conversations (id) VALUES (?)", [conversationId]);

    await pool.execute(
      "INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?), (?, ?)",
      [conversationId, req.user.id, conversationId, receiverId]
    );

    res.status(201).json({ conversationId });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ error: "Erreur lors de la création de la conversation" });
  }
});

router.get("/:id/messages", authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const [participants] = await pool.execute(
      "SELECT userId FROM conversation_participants WHERE conversationId = ? AND userId = ?",
      [conversationId, req.user.id]
    );

    if (participants.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé à cette conversation" });
    }

    const [messages] = await pool.execute(
      `
      SELECT m.*, u.firstName, u.lastName, u.avatar
      FROM messages m
      JOIN users u ON m.senderId = u.id
      WHERE m.conversationId = ?
      ORDER BY m.createdAt ASC
      `,
      [conversationId]
    );

    await pool.execute(
      "UPDATE messages SET isRead = TRUE WHERE conversationId = ? AND senderId != ?",
      [conversationId, req.user.id]
    );

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/:id/participants", authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const [userCheck] = await pool.execute(
      "SELECT userId FROM conversation_participants WHERE conversationId = ? AND userId = ?",
      [conversationId, req.user.id]
    );

    if (userCheck.length === 0) {
      return res.status(403).json({ error: "Accès non autorisé à cette conversation" });
    }

    const [participants] = await pool.execute(
      `
      SELECT u.id, u.firstName, u.lastName, u.email, u.position, u.location, u.region, u.avatar, u.isAdmin
      FROM conversation_participants cp
      JOIN users u ON cp.userId = u.id
      WHERE cp.conversationId = ?
      `,
      [conversationId]
    );

    res.json(participants);
  } catch (error) {
    console.error("Get participants error:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
