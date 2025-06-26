const request = require("supertest");
const app = require("../../app"); // Votre app Express
const { pool } = require("../../server/config/database");
const jwt = require("jsonwebtoken");

// Générer un token JWT pour l'utilisateur fictif
const mockUser = { id: 1, email: "user1@example.com" };
const token = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET, {
  expiresIn: "1h",
});

const authHeader = { Authorization: `Bearer ${token}` };

describe("Conversations API", () => {
  let conversationId;
  let receiverId = 2;

  beforeAll(async () => {
    // Préparer des utilisateurs de test
    await pool.execute(`INSERT IGNORE INTO users (id, email, firstName, lastName, password) VALUES 
      (1, 'user1@example.com', 'User', 'One', 'pass'),
      (2, 'user2@example.com', 'User', 'Two', 'pass')`);
  });

  afterAll(async () => {
    // Nettoyer
    await pool.execute("DELETE FROM conversation_participants WHERE conversationId = ?", [conversationId]);
    await pool.execute("DELETE FROM conversations WHERE id = ?", [conversationId]);
    await pool.execute("DELETE FROM users WHERE id IN (1, 2)");
    await pool.end();
  });

  test("Créer une conversation", async () => {
    const res = await request(app)
      .post("/conversations")
      .set(authHeader)
      .send({ receiverId });

    expect(res.statusCode).toBe(201);
    expect(res.body.conversationId).toBeDefined();

    conversationId = res.body.conversationId;
  });

  test("Vérifier si une conversation existe déjà", async () => {
    const res = await request(app)
      .get("/conversations/existing")
      .set(authHeader)
      .query({ userId: receiverId });

    expect(res.statusCode).toBe(200);
    expect(res.body.conversationId).toBe(conversationId);
  });

  test("Récupérer toutes les conversations de l'utilisateur", async () => {
    const res = await request(app)
      .get("/conversations")
      .set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Récupérer les messages d'une conversation", async () => {
    // On simule un message dans la conversation
    await pool.execute(
      "INSERT INTO messages (conversationId, senderId, content) VALUES (?, ?, ?)",
      [conversationId, mockUser.id, "Bonjour"]
    );

    const res = await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("content", "Bonjour");
  });

  test("Récupérer les participants d'une conversation", async () => {
    const res = await request(app)
      .get(`/conversations/${conversationId}/participants`)
      .set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(u => u.id === receiverId)).toBe(true);
  });

  test("Refuser l'accès à une conversation non appartenant à l'utilisateur", async () => {
    // Création conversation tierce
    await pool.execute("INSERT INTO users (id, email, firstName, lastName, password) VALUES (3, 'x@x.com', 'X', 'Y', 'p')");
    const [result] = await pool.execute("INSERT INTO conversations (id) VALUES (UUID())");
    const otherConvId = result.insertId;
    await pool.execute("INSERT INTO conversation_participants (conversationId, userId) VALUES (?, ?)", [otherConvId, 3]);

    const res = await request(app)
      .get(`/conversations/${otherConvId}/messages`)
      .set(authHeader);

    expect(res.statusCode).toBe(403);

    await pool.execute("DELETE FROM conversation_participants WHERE conversationId = ?", [otherConvId]);
    await pool.execute("DELETE FROM conversations WHERE id = ?", [otherConvId]);
    await pool.execute("DELETE FROM users WHERE id = 3");
  });
});
