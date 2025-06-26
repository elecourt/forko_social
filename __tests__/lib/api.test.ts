import {
  getUsers,
  createUser,
  deleteUser,
  getPosts,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  uploadImage,
  requestPasswordReset,
  resetPassword,
} from "../../lib/api"

global.fetch = jest.fn()

const mockFetch = fetch as jest.Mock

describe("API functions", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("getUsers", () => {
    it("should fetch users successfully", async () => {
      const fakeUsers = [{ id: "1", firstName: "Alice" }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => fakeUsers,
      })

      const users = await getUsers()
      expect(users).toEqual(fakeUsers)
      expect(mockFetch).toHaveBeenCalled()
    })

    it("should throw an error on failed fetch", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      await expect(getUsers()).rejects.toThrow("Failed to fetch users")
    })
  })

  describe("createUser", () => {
    it("should create a user", async () => {
      const newUser = { firstName: "Bob" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newUser,
      })

      const result = await createUser(newUser)
      expect(result).toEqual(newUser)
    })
  })

  describe("getPosts", () => {
    it("should fetch posts", async () => {
      const mockPosts = [{ id: "post1", content: "Test post" }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      })

      const posts = await getPosts()
      expect(posts).toEqual(mockPosts)
    })
  })

  describe("createPost", () => {
    it("should create a post", async () => {
      const mockPost = { content: "Test", imageUrl: "" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPost,
      })

      const result = await createPost("Test")
      expect(result).toEqual(mockPost)
    })
  })

  describe("likePost & unlikePost", () => {
    it("should like a post", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(likePost("123")).resolves.toBeUndefined()
    })

    it("should unlike a post", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(unlikePost("123")).resolves.toBeUndefined()
    })
  })

  describe("addComment", () => {
    it("should add comment", async () => {
      const mockComment = { id: "c1", content: "Nice!" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockComment,
      })

      const result = await addComment("post1", "Nice!")
      expect(result).toEqual(mockComment)
    })
  })

  describe("conversations and messages", () => {
    it("should fetch conversations", async () => {
      const conv = [{ id: "c1", participants: [] }]
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => conv,
      })

      const result = await getConversations()
      expect(result).toEqual(conv)
    })

    it("should send message", async () => {
      const data = {
        message: { id: "msg1", content: "Hello" },
        conversationId: "conv1",
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      })

      const result = await sendMessage("u1", "Hello")
      expect(result).toEqual(data)
    })
  })

  describe("uploadImage", () => {
    it("should upload an image", async () => {
      const mockResponse = { imageUrl: "http://img.jpg" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const fakeFile = new File(["data"], "test.jpg", { type: "image/jpeg" })
      const result = await uploadImage(fakeFile)
      expect(result).toEqual(mockResponse)
    })
  })

  describe("password reset", () => {
    it("should request password reset", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(requestPasswordReset("test@example.com")).resolves.toBeUndefined()
    })

    it("should reset password", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      await expect(resetPassword("token123", "newpass")).resolves.toBeUndefined()
    })
  })
})
