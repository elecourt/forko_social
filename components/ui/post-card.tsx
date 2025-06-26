"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MessageSquare, Heart, Send, MoreVertical, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Button } from "./button"
import { Input } from "./input"
import { useToast } from "@/hooks/use-toast"
import type { Post, Comment } from "@/lib/types"
import { likePost, unlikePost, addComment, deletePost, getCurrentUser } from "@/lib/api"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: Post
  onPostUpdate?: () => void
  onPostDelete?: (postId: string) => void
}

export function PostCard({ post, onPostUpdate, onPostDelete }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likes || post.likesCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState<Comment[]>(post.comments || [])
  const [imageError, setImageError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      console.error("Error loading current user:", error)
    }
  }

  // Construire l'URL complète de l'image
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null

    // Si l'URL commence déjà par http, la retourner telle quelle
    if (imageUrl.startsWith("http")) {
      return imageUrl
    }

    // Sinon, construire l'URL complète
    return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`
  }

  const fullImageUrl = getImageUrl(post.imageUrl)

  useEffect(() => {
    if (fullImageUrl) {
      // Précharger l'image pour vérifier si elle existe
      const img = new Image()
      img.onload = () => setImageError(false)
      img.onerror = () => {
        console.error("Failed to load image:", fullImageUrl)
        setImageError(true)
      }
      img.src = fullImageUrl
    }
  }, [fullImageUrl])

  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        await unlikePost(post.id)
        setLikesCount((prev) => prev - 1)
      } else {
        await likePost(post.id)
        setLikesCount((prev) => prev + 1)
        toast({
          title: "J'aime",
          description: "Vous avez aimé cette publication",
        })
      }
      setIsLiked(!isLiked)
      if (onPostUpdate) onPostUpdate()
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le j'aime",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      const comment = await addComment(post.id, newComment)
      setComments([...comments, comment])
      setNewComment("")
      if (onPostUpdate) onPostUpdate()
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le commentaire",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette publication ?")) {
      try {
        setIsDeleting(true)
        await deletePost(post.id)
        toast({
          title: "Publication supprimée",
          description: "Votre publication a été supprimée avec succès",
        })
        if (onPostDelete) {
          onPostDelete(post.id)
        }
      } catch (error) {
        console.error("Error deleting post:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la publication",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const initials = `${post.author.firstName[0]}${post.author.lastName[0]}`.toUpperCase()

  // Vérifier si l'utilisateur est l'auteur du post ou un admin
  const canDelete = currentUser && (currentUser.id === post.authorId || currentUser.isAdmin)

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Avatar className="w-10 h-10 mr-3">
            <AvatarImage src={post.author.avatar || "/placeholder.png"} alt={initials} />
            <AvatarFallback className="bg-forko-pink text-forko-green-dark font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-forko-green-dark">
              {post.author.firstName} {post.author.lastName}
            </h3>
            <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={handleDeletePost}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isDeleting ? "Suppression..." : "Supprimer"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mb-3">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {fullImageUrl && !imageError && (
        <div className="mb-3">
          <img
            src={fullImageUrl || "/placeholder.svg"}
            alt="Post image"
            className="w-full rounded-lg object-cover max-h-96"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {post.imageUrl && imageError && (
        <div className="mb-3 p-4 bg-gray-100 rounded-lg text-center text-gray-500">
          <p>Image non disponible</p>
          <p className="text-xs">{post.imageUrl}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-gray-500 border-t border-gray-100 pt-3">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center ${isLiked ? "text-red-500" : ""}`}
          onClick={handleLikeToggle}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          <span>{likesCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="flex items-center" onClick={() => setShowComments(!showComments)}>
          <MessageSquare className="w-4 h-4 mr-1" />
          <span>{comments.length}</span>
        </Button>
      </div>

      {showComments && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {comments.length > 0 ? (
            <div className="space-y-3 mb-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start">
                  <Avatar className="w-8 h-8 mr-2">
                    <AvatarImage
                      src={comment.author.avatar || "/placeholder.png"}
                      alt={`${comment.author.firstName[0]}${comment.author.lastName[0]}`.toUpperCase()}
                    />
                    <AvatarFallback className="bg-forko-pink text-forko-green-dark text-xs font-semibold">
                      {`${comment.author.firstName[0]}${comment.author.lastName[0]}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-2 flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-forko-green-dark">
                        {comment.author.firstName} {comment.author.lastName}
                      </h4>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">Aucun commentaire pour le moment</p>
          )}

          <form onSubmit={handleAddComment} className="flex items-center">
            <Input
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 mr-2"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newComment.trim() || isSubmitting}
              className="bg-forko-green hover:bg-forko-green-dark text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
