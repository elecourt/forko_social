const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { pool } = require("./config/database");
const { v4: uuidv4 } = require("uuid"); // Import UUID

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");
const conversationsRoutes = require("./routes/conversations");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
});

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ Nouveau client connecté :", socket.id);

  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    console.log(`👤 Socket ${socket.id} a rejoint la conversation ${conversationId}`);
  });

  socket.on("sendMessage", async ({ conversationId, senderId, content }) => {
    console.log("Message reçu serveur:", { conversationId, senderId, content });

    try {
      const id = uuidv4(); // Génère un UUID côté serveur

      // Stocker le message en DB avec l'ID explicite
      await pool.execute(
        "INSERT INTO messages (id, conversationId, senderId, content, createdAt) VALUES (?, ?, ?, ?, NOW())",
        [id, conversationId, senderId, content]
      );

      // Récupérer le message complet avec id, createdAt
      const [rows] = await pool.execute(
        "SELECT * FROM messages WHERE id = ?",
        [id]
      );
      const message = rows[0];

      // Émettre à tous les membres dans la conversation
      io.to(conversationId).emit("receiveMessage", message);
      console.log("Message émis à la room", conversationId, message);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Déconnexion :", socket.id);
  });
});

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Serve uploads (si nécessaire)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/upload", uploadRoutes);

server.listen(PORT, async () => {
  try {
    await pool.execute("SELECT 1");
    console.log("✅ Base de données connectée");
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error);
  }
  console.log(`🚀 Serveur WebSocket + API démarré sur le port ${PORT}`);
});
