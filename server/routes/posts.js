const express = require("express")
const { pool } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

router.get("/", authenticateToken, async (req, res) => {
  try {
    const { region } = req.query

    let query = `
      SELECT 
        p.*,
        u.firstName, u.lastName, u.position, u.location, u.avatar,
        COUNT(DISTINCT pl.id) as likes,
        COUNT(DISTINCT c.id) as commentsCount,
        EXISTS(SELECT 1 FROM post_likes WHERE postId = p.id AND userId = ?) as isLiked
      FROM posts p
      JOIN users u ON p.authorId = u.id
      LEFT JOIN post_likes pl ON p.id = pl.postId
      LEFT JOIN comments c ON p.id = c.postId
    `

    const params = [req.user.id]

    if (region && region !== "national") {
      query += " WHERE p.region = ?"
      params.push(region)
    }

    query += `
      GROUP BY p.id, u.id
      ORDER BY p.createdAt DESC
    `

    const [posts] = await pool.execute(query, params)

    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const [comments] = await pool.execute(
          `
          SELECT 
            c.*,
            u.firstName, u.lastName, u.avatar
          FROM comments c
          JOIN users u ON c.authorId = u.id
          WHERE c.postId = ?
          ORDER BY c.createdAt ASC
        `,
          [post.id],
        )

        return {
          id: post.id,
          authorId: post.authorId,
          content: post.content,
          imageUrl: post.imageUrl,
          region: post.region,
          createdAt: post.createdAt,
          author: {
            id: post.authorId,
            firstName: post.firstName,
            lastName: post.lastName,
            position: post.position,
            location: post.location,
            avatar: post.avatar,
          },
          likes: Number.parseInt(post.likes),
          isLiked: Boolean(post.isLiked),
          comments: comments.map((comment) => ({
            id: comment.id,
            authorId: comment.authorId,
            content: comment.content,
            createdAt: comment.createdAt,
            author: {
              id: comment.authorId,
              firstName: comment.firstName,
              lastName: comment.lastName,
              avatar: comment.avatar,
            },
          })),
        }
      }),
    )

    res.json(postsWithComments)
  } catch (error) {
    console.error("Get posts error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { content, imageUrl } = req.body

    console.log("Creating post:", { content, imageUrl, userId: req.user.id, region: req.user.region })

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Le contenu est requis" })
    }

    if (!req.user || !req.user.id || !req.user.region) {
      console.error("Invalid user:", req.user)
      return res.status(400).json({ error: "Utilisateur invalide" })
    }

    const imageUrlValue = imageUrl && imageUrl.trim() !== "" ? imageUrl : null

    const [result] = await pool.execute("INSERT INTO posts (authorId, content, imageUrl, region) VALUES (?, ?, ?, ?)", [
      req.user.id,
      content.trim(),
      imageUrlValue,
      req.user.region,
    ])

    console.log("Post inserted with ID:", result.insertId)

    const [posts] = await pool.execute(
      `
      SELECT 
        p.*,
        u.firstName, u.lastName, u.position, u.location, u.avatar
      FROM posts p
      JOIN users u ON p.authorId = u.id
      WHERE p.id = ?
    `,
      [result.insertId],
    )

    if (posts.length === 0) {
      console.error("Post not found after creation")
      return res.status(500).json({ error: "Erreur lors de la création du post" })
    }

    const post = posts[0]

    const responsePost = {
      id: post.id,
      authorId: post.authorId,
      content: post.content,
      imageUrl: post.imageUrl,
      region: post.region,
      createdAt: post.createdAt,
      author: {
        id: post.authorId,
        firstName: post.firstName,
        lastName: post.lastName,
        position: post.position,
        location: post.location,
        avatar: post.avatar,
      },
      likes: 0,
      isLiked: false,
      comments: [],
    }

    console.log("Returning post:", responsePost)
    res.status(201).json(responsePost)
  } catch (error) {
    console.error("Create post error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.user.id
    const isAdmin = req.user.isAdmin

    const [posts] = await pool.execute("SELECT authorId FROM posts WHERE id = ?", [postId])

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post non trouvé" })
    }

    const post = posts[0]

    if (post.authorId !== userId && !isAdmin) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce post" })
    }

    await pool.execute("DELETE FROM post_likes WHERE postId = ?", [postId])
    await pool.execute("DELETE FROM comments WHERE postId = ?", [postId])

    await pool.execute("DELETE FROM posts WHERE id = ?", [postId])

    console.log(`Post ${postId} deleted by user ${userId}`)
    res.json({ message: "Post supprimé avec succès" })
  } catch (error) {
    console.error("Delete post error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id
    const userId = req.user.id

    const [existingLikes] = await pool.execute("SELECT id FROM post_likes WHERE postId = ? AND userId = ?", [
      postId,
      userId,
    ])

    if (existingLikes.length > 0) {
      await pool.execute("DELETE FROM post_likes WHERE postId = ? AND userId = ?", [postId, userId])
    } else {
      await pool.execute("INSERT INTO post_likes (postId, userId) VALUES (?, ?)", [postId, userId])
    }

    res.json({ message: "Like mis à jour" })
  } catch (error) {
    console.error("Like post error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})


router.post("/:id/comments", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id
    const { content } = req.body

    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "Le contenu du commentaire est requis" })
    }

    const [result] = await pool.execute("INSERT INTO comments (postId, authorId, content) VALUES (?, ?, ?)", [
      postId,
      req.user.id,
      content.trim(),
    ])

    const [comments] = await pool.execute(
      `
      SELECT 
        c.*,
        u.firstName, u.lastName, u.avatar
      FROM comments c
      JOIN users u ON c.authorId = u.id
      WHERE c.id = ?
    `,
      [result.insertId],
    )

    const comment = comments[0]

    res.status(201).json({
      id: comment.id,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.authorId,
        firstName: comment.firstName,
        lastName: comment.lastName,
        avatar: comment.avatar,
      },
    })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({ error: "Erreur serveur" })
  }
})

module.exports = router
