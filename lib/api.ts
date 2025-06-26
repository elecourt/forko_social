import type { User, Post, Message, Conversation, Comment } from "./types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function getUsers(region?: string): Promise<User[]> {
  const url = new URL(`${API_URL}/api/users`)
  if (region) url.searchParams.set("region", region)

  const response = await fetch(url.toString(), {
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to fetch users")
  return response.json()
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  })

  if (!response.ok) throw new Error("Failed to create user")
  return response.json()
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to delete user")
}

export async function getPosts(region?: string): Promise<Post[]> {
  const url = new URL(`${API_URL}/api/posts`)
  if (region) url.searchParams.set("region", region)

  const response = await fetch(url.toString(), {
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to fetch posts")
  return response.json()
}

export async function createPost(content: string, imageUrl?: string): Promise<Post> {
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content, imageUrl }),
  })

  if (!response.ok) throw new Error("Failed to create post")
  return response.json()
}

export async function deletePost(postId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to delete post")
}

export async function likePost(postId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to like post")
}

export async function unlikePost(postId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/unlike`, {
    method: "POST",
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to unlike post")
}

export async function addComment(postId: string, content: string): Promise<Comment> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content }),
  })

  if (!response.ok) throw new Error("Failed to add comment")
  return response.json()
}

// Messages API
export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to fetch conversations")
  return response.json()
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}/messages`, {
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to fetch messages")
  return response.json()
}

export async function sendMessage(
  receiverId: string,
  content: string,
): Promise<{ message: Message; conversationId: string }> {
  const response = await fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ receiverId, content }),
  })

  if (!response.ok) throw new Error("Failed to send message")
  return response.json()
}

export async function createConversation(receiverId: string): Promise<{ conversationId: string }> {
  const response = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ receiverId }),
  })

  if (!response.ok) throw new Error("Failed to create conversation")
  return response.json()
}

export async function uploadImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData()
  formData.append("image", file)

  const response = await fetch(`${API_URL}/api/upload/image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!response.ok) throw new Error("Failed to upload image")
  return response.json()
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) throw new Error("Failed to request password reset")
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password: newPassword }),
  })

  if (!response.ok) throw new Error("Failed to reset password")
}

export { getCurrentUser } from "./auth"
