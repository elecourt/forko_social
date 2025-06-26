export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  position: string
  location: string
  region: string
  avatar?: string
  isAdmin?: boolean
}

export interface Post {
  id: string
  authorId: string
  author: User
  content: string
  imageUrl?: string
  createdAt: string
  likes: number
  likesCount?: number
  comments: Comment[]
  isLiked: boolean
  region: string
}

export interface Comment {
  id: string
  authorId: string
  author: User
  content: string
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  conversationId?: string
  content: string
  createdAt: string
  isRead: boolean
  firstName?: string
  lastName?: string
  avatar?: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage: Message
  unreadCount: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
