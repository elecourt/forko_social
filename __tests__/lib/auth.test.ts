import { login, logout, getCurrentUser } from "../../lib/auth"

// Mock global fetch
global.fetch = jest.fn()

const mockFetch = fetch as jest.MockedFunction<typeof fetch>

describe("auth API functions", () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("login", () => {
    it("devrait retourner un user si login réussi", async () => {
      const mockUser = { id: "1", email: "test@test.com", firstName: "Test" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response)

      const user = await login("test@test.com", "password")
      expect(user).toEqual(mockUser)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@test.com", password: "password" }),
          credentials: "include",
        }),
      )
    })

    it("devrait lancer une erreur si login échoue", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(login("wrong@test.com", "badpass")).rejects.toThrow("Identifiants incorrects")
    })
  })

  describe("logout", () => {
    it("devrait appeler l'API logout", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response)

      await logout()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/logout"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      )
    })
  })

  describe("getCurrentUser", () => {
    it("devrait retourner un user si réponse ok", async () => {
      const mockUser = { id: "1", email: "current@test.com", firstName: "Current" }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response)

      const user = await getCurrentUser()
      expect(user).toEqual(mockUser)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/me"),
        expect.objectContaining({
          credentials: "include",
        }),
      )
    })

    it("devrait retourner null si réponse pas ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response)

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it("devrait retourner null en cas d'erreur réseau", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const user = await getCurrentUser()
      expect(user).toBeNull()
    })
  })
})
