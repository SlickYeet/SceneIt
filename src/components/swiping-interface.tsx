"use client"

import { Calendar, Clock, Heart, Info, Star, Users, X } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { env } from "@/env"
import { usePreferences } from "@/hooks/use-preferences"
import { tmdbService, type Movie } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { User } from "@/type"

interface SwipingInterfaceProps {
  roomId?: string
  userName?: string
  user?: User | null
}

export function SwipingInterface(props: SwipingInterfaceProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [preferences, setPreferences] = usePreferences()

  const { roomId, userName, user } = props

  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  )
  const [isAnimating, setIsAnimating] = useState<boolean>(false)
  const [isNewCard, setIsNewCard] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [likedMovies, setLikedMovies] = useState<number[]>([])
  const [newMatches, setNewMatches] = useState<number[]>([])
  const [activeMatchNotification, setActiveMatchNotification] = useState<{
    movieId: number
    movieData?: Movie
  } | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })

  const [userId] = useState(
    () =>
      user?.id ||
      `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  )

  useEffect(() => {
    async function fetchMovies() {
      setIsLoading(true)
      try {
        let allMovies: Movie[] = []

        const genreIds = tmdbService.getGenreIds(preferences.genres)

        if (preferences.contentType.includes("movies")) {
          const movieResults =
            genreIds.length > 0
              ? await tmdbService.getMoviesByGenre(genreIds)
              : await tmdbService.getPopularMovies()
          allMovies = [...allMovies, ...movieResults]
        }

        if (preferences.contentType.includes("tv")) {
          const tvResults =
            genreIds.length > 0
              ? await tmdbService.getTVShowsByGenre(genreIds)
              : await tmdbService.getPopularTVShows()
          allMovies = [...allMovies, ...tvResults]
        }

        const shuffled = allMovies.sort(() => Math.random() - 0.5)
        setMovies(shuffled.length > 0 ? shuffled : [])
      } catch (error) {
        console.error("Failed to fetch movies, using mock data:", error)
        setMovies([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchMovies()
  }, [preferences])

  const currentMovie = movies[currentIndex]

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || !currentMovie) return

      setSwipeDirection(direction)
      setIsAnimating(true)

      if (direction === "right") {
        setLikedMovies((prev) => [...prev, currentMovie.id])

        if (user) {
          // add liked movie to user's liked movies
        }

        if (
          roomId &&
          (userName || user?.name) &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(
            JSON.stringify({
              type: "likedMovie",
              movieId: currentMovie.id,
              userId: user?.id ?? userName ?? "anon",
              roomId: roomId,
            }),
          )
        }
      }

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length)
        setSwipeDirection(null)
        setIsNewCard(true)
        setShowDetails(false)
        setDragOffset({ x: 0, y: 0 })

        setTimeout(() => {
          setIsNewCard(false)
          setIsAnimating(false)
        }, 300)
      }, 300)
    },
    [isAnimating, currentMovie, user, roomId, userName, userId, movies.length],
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || isAnimating) return

      const deltaX = clientX - dragStart.x
      const deltaY = clientY - dragStart.y

      setDragOffset({ x: deltaX, y: deltaY })
    },
    [isDragging, isAnimating, dragStart],
  )

  const handleEnd = useCallback(() => {
    if (!isDragging || isAnimating) return

    setIsDragging(false)

    const threshold = 100
    const absX = Math.abs(dragOffset.x)

    if (absX > threshold) {
      const direction = dragOffset.x > 0 ? "right" : "left"
      handleSwipe(direction)
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }, [isDragging, isAnimating, dragOffset, handleSwipe])

  function handleStart(clientX: number, clientY: number) {
    if (isAnimating) return
    setIsDragging(true)
    setDragStart({ x: clientX, y: clientY })
    setDragOffset({ x: 0, y: 0 })
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    if (!isDragging) return

    function handleGlobalMouseMove(e: MouseEvent) {
      handleMove(e.clientX, e.clientY)
    }

    function handleGlobalMouseUp() {
      handleEnd()
    }

    document.addEventListener("mousemove", handleGlobalMouseMove)
    document.addEventListener("mouseup", handleGlobalMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
      document.removeEventListener("mouseup", handleGlobalMouseUp)
    }
  }, [isDragging, dragStart, dragOffset, handleEnd, handleMove])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isAnimating) return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleSwipe("left")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleSwipe("right")
      } else if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault()
        setShowDetails(!showDetails)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isAnimating, showDetails, handleSwipe])

  useEffect(() => {
    if (!roomId) return

    const wsUrl = env.NEXT_PUBLIC_WS_URL
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "join",
          roomId,
          userId: user?.id ?? userName ?? "anon",
          userName: userName || user?.name || "anonymous",
        }),
      )
    })

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (msg.type === "match" && msg.roomId === roomId) {
          setNewMatches((prev) => [...prev, msg.match.movieId])
          setMovies((currentMovies) => {
            const matchedMovie = currentMovies.find(
              (m) => m.id === msg.match.movieId,
            )
            setActiveMatchNotification({
              movieId: msg.match.movieId,
              movieData: matchedMovie,
            })
            return currentMovies
          })
        }
      } catch (error) {
        console.error("Malformed WS message", error)
      }
    })
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [roomId, user?.id, userName])

  function getCardStyle() {
    if (swipeDirection === "left") {
      return {
        transform: "translateX(-100%) rotate(-12deg)",
        opacity: 0,
      }
    }

    if (swipeDirection === "right") {
      return {
        transform: "translateX(100%) rotate(12deg)",
        opacity: 0,
      }
    }

    if (isNewCard) {
      return {
        transform: "translateY(20px)",
        opacity: 0,
      }
    }

    if (isDragging) {
      const rotation = dragOffset.x * 0.1
      const opacity = Math.max(0.5, 1 - Math.abs(dragOffset.x) / 300)
      return {
        transform: `translateX(${dragOffset.x}px) rotate(${rotation}deg)`,
        opacity,
      }
    }

    return {
      transform: "translateX(0px) translateY(0px) rotate(0deg)",
      opacity: 1,
    }
  }

  if (isLoading) return null

  if (!currentMovie && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <h2 className="font-heading text-2xl font-bold">
            No more recommendations!
          </h2>
          <p className="text-muted-foreground">
            Check back later for more movies and shows.
          </p>
          <Button
            onClick={() => {
              setCurrentIndex(0)
              setPreferences({
                contentType: [],
                genres: [],
              })
            }}
            variant="outline"
          >
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden p-4">
      <div className="mx-auto max-w-sm space-y-4 py-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-bold">SceneIt</h1>
            {roomId && (
              <Badge
                onClick={() => {
                  navigator.clipboard.writeText(roomId)
                  toast.success("Room ID copied to clipboard")
                }}
                className="bg-foreground hover:bg-foreground/80 text-background cursor-pointer rounded-full transition-colors"
              >
                <Users />
                <span className="text-xs font-medium">{roomId}</span>
              </Badge>
            )}
          </div>
          <Badge className="bg-foreground hover:bg-foreground/80 text-background cursor-pointer rounded-full text-xs transition-colors">
            {currentIndex + 1} / {movies.length}
          </Badge>
        </div>

        {activeMatchNotification && (
          <Card className="animate-in fade-in-0 slide-in-from-top-1 border-primary/25 bg-primary/10 relative duration-300">
            <button
              onClick={() => setActiveMatchNotification(null)}
              className="bg-primary/20 hover:bg-primary/30 border-primary/25 absolute -top-2 -right-2 rounded-full border p-1 transition-colors"
            >
              <X className="text-primary size-3" />
            </button>

            <CardContent className="text-center">
              <div className="text-primary flex items-center justify-center gap-2">
                <Heart className="size-5 fill-current" />
                <span className="font-semibold">It&apos;s a Match!</span>
              </div>
              <p className="text-primary/80 mt-1 text-sm text-balance">
                You and your friends both love this{" "}
                {(() => {
                  const movieData =
                    activeMatchNotification.movieData ||
                    movies.find((m) => m.id === activeMatchNotification.movieId)
                  return movieData?.type
                })()}
                :
              </p>

              <div className="text-primary/80 mt-4">
                {(() => {
                  const movieData =
                    activeMatchNotification.movieData ||
                    movies.find((m) => m.id === activeMatchNotification.movieId)

                  const typeLabel =
                    movieData?.type === "tv"
                      ? "TV show"
                      : movieData?.type === "movie"
                        ? "Movie"
                        : "Unknown"

                  if (movieData) {
                    return (
                      <span className="ml-2 inline-flex items-center gap-3">
                        <span className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-sm">
                          <Image
                            src={movieData.poster}
                            alt={movieData.title}
                            fill
                            className="object-cover"
                          />
                        </span>
                        <span className="text-left">
                          <span className="block font-semibold">
                            {movieData.title}
                          </span>
                          <span className="text-primary/80 block text-xs">
                            {movieData.year} • {typeLabel}
                          </span>
                        </span>
                      </span>
                    )
                  }

                  return "Unknown Movie or TV show"
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative h-[600px]">
          <Card
            ref={cardRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
            style={getCardStyle()}
            className={cn(
              "absolute inset-0 cursor-grab overflow-hidden py-0 transition-all duration-200 select-none",
              isDragging && "cursor-grabbing transition-none",
              isNewCard && "transition-all ease-out",
            )}
          >
            <div className="relative h-full">
              <Image
                src={currentMovie.poster}
                alt={currentMovie.title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://placehold.co/400x600?text=${currentMovie.title + " poster" || "No Image"}`
                }}
                fill
                className="size-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute right-0 bottom-0 left-0 p-6 text-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="border-0 bg-white/20 text-white"
                    >
                      {currentMovie.type === "movie" ? "Movie" : "TV Show"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {currentMovie.rating}
                      </span>
                    </div>
                  </div>

                  <h2 className="font-heading text-2xl font-bold">
                    {currentMovie.title}
                  </h2>

                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>{currentMovie.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-4" />
                      <span>{currentMovie.runtime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentMovie.genres.slice(0, 3).map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-white/30 text-white"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {swipeDirection === "left" && (
                <div className="bg-destructive/20 absolute inset-0 flex items-center justify-center">
                  <div className="bg-destructive rounded-full p-4">
                    <X className="size-8 text-white" />
                  </div>
                </div>
              )}
              {swipeDirection === "right" && (
                <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary rounded-full p-4">
                    <Heart className="size-8 text-white" />
                  </div>
                </div>
              )}

              {/* Show drag indicators while dragging */}
              {isDragging && dragOffset.x < -50 && (
                <div className="bg-destructive/20 absolute inset-0 flex items-center justify-center">
                  <div className="bg-destructive animate-pulse rounded-full p-4">
                    <X className="size-8 text-white" />
                  </div>
                </div>
              )}
              {isDragging && dragOffset.x > 50 && (
                <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary animate-pulse rounded-full p-4">
                    <Heart className="size-8 text-white" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            disabled={isAnimating}
            onClick={() => handleSwipe("left")}
            size="lg"
            variant="outline"
            className="group size-14 rounded-full border-2 border-red-200 bg-white/80 p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-red-300 hover:bg-red-50"
          >
            <X className="size-6 text-red-500 transition-colors group-hover:text-red-600" />
          </Button>

          <Button
            onClick={() => setShowDetails(!showDetails)}
            size="lg"
            variant="outline"
            className="group size-12 rounded-full border-2 border-blue-200 bg-white/80 p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-blue-300 hover:bg-blue-50"
          >
            <Info className="size-5 text-blue-500 transition-colors group-hover:text-blue-600" />
          </Button>

          <Button
            disabled={isAnimating}
            onClick={() => handleSwipe("right")}
            size="lg"
            variant="outline"
            className="hover:border-primary/50! hover:bg-primary/10! size-14 rounded-full border-2 p-0"
          >
            <Heart className="size-6 text-emerald-500 transition-colors group-hover:text-emerald-600" />
          </Button>
        </div>

        {showDetails && (
          <Card className="mt-4">
            <CardContent className="space-y-4 p-6">
              <h3 className="font-heading font-bold">
                About this {currentMovie.type}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentMovie.overview}
              </p>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {currentMovie.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-muted-foreground space-y-1 text-center text-sm">
          <p>Swipe or drag cards • Use arrow keys • Tap buttons</p>
          {user?.isGuest && (
            <p className="text-destructive text-xs">
              Guest mode: Preferences won&apos;t be saved
            </p>
          )}
        </div>

        {likedMovies.length > 0 && (
          <div className="text-muted-foreground text-center text-xs">
            {likedMovies.length} movies liked{" "}
            {roomId && newMatches.length > 0 && (
              <>
                •{" "}
                <span className="text-primary">
                  {newMatches.length} matches found!
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
