const { pool } = require("../config/database")
const bcrypt = require("bcryptjs")

async function initDatabase() {
  try {
    console.log("🚀 Initialisation de la base de données...")

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        position VARCHAR(200) NOT NULL,
        location VARCHAR(200) NOT NULL,
        region VARCHAR(100) NOT NULL,
        avatar VARCHAR(500),
        isAdmin BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        userId VARCHAR(36) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        authorId VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        imageUrl VARCHAR(500),
        region VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_author (authorId),
        INDEX idx_region (region),
        INDEX idx_created (createdAt),
        FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create post_likes table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        postId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post (postId),
        INDEX idx_user (userId),
        UNIQUE KEY unique_like (postId, userId),
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create comments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        postId VARCHAR(36) NOT NULL,
        authorId VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post (postId),
        INDEX idx_author (authorId),
        INDEX idx_created (createdAt),
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create conversations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create conversation_participants table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        conversationId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversationId),
        INDEX idx_user (userId),
        UNIQUE KEY unique_participant (conversationId, userId),
        FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // Create messages table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        conversationId VARCHAR(36) NOT NULL,
        senderId VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        isRead BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversationId),
        INDEX idx_sender (senderId),
        INDEX idx_created (createdAt),
        FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log("✅ Tables créées avec succès")

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12)

    await pool.execute(
      `
      INSERT IGNORE INTO users (email, password, firstName, lastName, position, location, region, isAdmin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        "admin@forko-conseil.fr",
        hashedPassword,
        "Admin",
        "Forko",
        "Administrateur",
        "Paris, France",
        "Île-de-France",
        true,
      ],
    )

    // Create sample users
    const sampleUsers = [
      {
        email: "emeline.lecourt@forko-conseil.fr",
        firstName: "Emeline",
        lastName: "Lecourt",
        position: "Consultante Senior",
        location: "Paris, France",
        region: "Île-de-France",
      },
      {
        email: "julien.martin@forko-conseil.fr",
        firstName: "Julien",
        lastName: "Martin",
        position: "Consultant",
        location: "Lyon, France",
        region: "Auvergne-Rhône-Alpes",
      },
      {
        email: "sophie.dubois@forko-conseil.fr",
        firstName: "Sophie",
        lastName: "Dubois",
        position: "Manager",
        location: "Toulouse, France",
        region: "Occitanie",
      },
      {
        email: "pierre.bernard@forko-conseil.fr",
        firstName: "Pierre",
        lastName: "Bernard",
        position: "Consultant Junior",
        location: "Marseille, France",
        region: "Provence-Alpes-Côte d'Azur",
      },
      {
        email: "marie.durand@forko-conseil.fr",
        firstName: "Marie",
        lastName: "Durand",
        position: "Consultante",
        location: "Nantes, France",
        region: "Pays de la Loire",
      },
    ]

    for (const user of sampleUsers) {
      const password = await bcrypt.hash("password123", 12)
      await pool.execute(
        `
        INSERT IGNORE INTO users (email, password, firstName, lastName, position, location, region)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [user.email, password, user.firstName, user.lastName, user.position, user.location, user.region],
      )
    }

    // Create sample posts
    const [users] = await pool.execute("SELECT id, firstName, lastName FROM users WHERE email != ?", [
      "admin@forko-conseil.fr",
    ])

    const samplePosts = [
      {
        content: "Excellente mission chez notre client dans le secteur bancaire ! L'équipe était très motivée.",
        authorId: users[0]?.id,
      },
      {
        content: "Retour de formation sur les nouvelles méthodologies agiles. Très enrichissant !",
        authorId: users[1]?.id,
      },
      {
        content: "Félicitations à toute l'équipe pour le succès du projet de transformation digitale 🎉",
        authorId: users[2]?.id,
      },
      {
        content: "Nouvelle certification obtenue ! Toujours important de se former continuellement.",
        authorId: users[0]?.id,
      },
    ]

    for (const post of samplePosts) {
      if (post.authorId) {
        const [userResult] = await pool.execute("SELECT region FROM users WHERE id = ?", [post.authorId])
        const userRegion = userResult[0]?.region || "Île-de-France"

        await pool.execute("INSERT INTO posts (authorId, content, region) VALUES (?, ?, ?)", [
          post.authorId,
          post.content,
          userRegion,
        ])
      }
    }

    console.log("✅ Utilisateurs de test créés")
    console.log("✅ Posts d'exemple créés")
    console.log("📧 Admin: admin@forko-conseil.fr / admin123")
    console.log("📧 Test: emeline.lecourt@forko-conseil.fr / password123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error)
    process.exit(1)
  }
}

initDatabase()
