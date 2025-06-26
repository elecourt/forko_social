"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Plus, ImageIcon, X } from "lucide-react"
import { Header } from "@/components/ui/header"
import { MobileLayout } from "@/components/ui/mobile-layout"
import { PostCard } from "@/components/ui/post-card"
import { FilterDialog } from "@/components/ui/filter-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { Post } from "@/lib/types"
import { getPosts, createPost, getCurrentUser } from "@/lib/api"

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadPosts()
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

  const loadPosts = async (region?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("Loading posts...")
      const data = await getPosts(region)
      console.log("Posts loaded:", data)
      setPosts(data)
    } catch (error) {
      console.error("Error loading posts:", error)
      setError("Impossible de charger les publications")
      toast({
        title: "Erreur",
        description: "Impossible de charger les publications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterApply = (filters: { region?: string; city?: string }) => {
    loadPosts(filters.region)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB",
          variant: "destructive",
        })
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Erreur lors de l'upload de l'image")
    }

    const data = await response.json()
    return data.imageUrl
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim() || isPosting) return

    try {
      setIsPosting(true)

      let imageUrl = ""
      if (selectedImage) {
        console.log("Uploading image...")
        imageUrl = await uploadImage(selectedImage)
        console.log("Image uploaded:", imageUrl)
      }

      console.log("Creating post with content:", newPostContent, "and image:", imageUrl)
      const newPost = await createPost(newPostContent, imageUrl || undefined)
      console.log("Post created from API:", newPost)

      const tempId = `temp-${Date.now()}-${Math.random()}`
      const optimisticPost: Post = {
        id: tempId, 
        authorId: currentUser?.id || newPost.authorId,
        content: newPostContent,
        imageUrl: imageUrl || newPost.imageUrl,
        region: currentUser?.region || newPost.region,
        createdAt: new Date().toISOString(),
        author: {
          id: currentUser?.id || newPost.author.id,
          email: currentUser?.email || newPost.author.email,
          firstName: currentUser?.firstName || newPost.author.firstName,
          lastName: currentUser?.lastName || newPost.author.lastName,
          position: currentUser?.position || newPost.author.position,
          location: currentUser?.location || newPost.author.location,
          region: currentUser?.region || newPost.author.region,
          avatar: currentUser?.avatar || newPost.author.avatar,
          isAdmin: currentUser?.isAdmin || newPost.author.isAdmin,
        },
        likes: 0,
        isLiked: false,
        comments: [],
      }

      console.log("Adding optimistic post:", optimisticPost)

      setPosts((prevPosts) => [optimisticPost, ...prevPosts])

      setTimeout(() => {
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === tempId ? { ...newPost, ...optimisticPost } : post)),
        )
      }, 1000)

      setNewPostContent("")
      removeImage()

      toast({
        title: "Publication créée",
        description: "Votre publication a été ajoutée avec succès",
      })
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la publication",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  const handlePostUpdate = () => {
    loadPosts()
  }

  const handlePostDelete = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }

  if (error && !isLoading) {
    return (
      <MobileLayout>
        <Header title="Fil d'actualité" showFilter showNotifications onFilterClick={() => setIsFilterOpen(true)} />
        <div className="p-4 bg-gray-100 min-h-screen">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => loadPosts()} className="bg-forko-green text-white">
              Réessayer
            </Button>
          </div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <Header title="Fil d'actualité" showFilter showNotifications onFilterClick={() => setIsFilterOpen(true)} />

      <div className="p-4 bg-[#187C71] min-h-screen">
        <form onSubmit={handleCreatePost} className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <div className="space-y-3">
            <textarea
              placeholder="Quoi de neuf ?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-forko-green"
              rows={3}
            />

            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.png"}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-forko-green"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Ajouter une image
              </Button>

              <Button
                type="submit"
                disabled={!newPostContent.trim() || isPosting}
                className="bg-forko-green hover:bg-forko-green-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isPosting ? "Publication..." : "Publier"}
              </Button>
            </div>
          </div>
        </form>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} onPostDelete={handlePostDelete} />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune actualité pour le moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      <FilterDialog isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={handleFilterApply} />
    </MobileLayout>
  )
}
