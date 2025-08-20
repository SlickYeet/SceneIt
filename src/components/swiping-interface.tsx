"use client"

import {
  Calendar,
  Clock,
  Dot,
  Heart,
  Info,
  Loader2,
  Star,
  Users,
  X,
} from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { matchingService } from "@/lib/matching"
import { tmdbService, type Movie } from "@/lib/tmdb"
import { cn } from "@/lib/utils"
import type { User } from "@/type"

interface SwipingInterfaceProps {
  preferences: {
    contentType: string[]
    genres: string[]
  }
  roomId?: string
  userName?: string
  user?: User | null
}

export function SwipingInterface(props: SwipingInterfaceProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const { preferences, roomId, userName, user } = props

  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null,
  )
  const [isAnimating, setIsAnimating] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [likedMovies, setLikedMovies] = useState<number[]>([])
  const [newMatches, setNewMatches] = useState<number[]>([])

  const [userId] = useState(
    () =>
      user?.id ||
      `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  )

  useEffect(() => {
    async function fetchMovies() {
      setIsLoading(true)
      try {
        let allMovies: Movie[] = []

        const genreIds = tmdbService.getGenreIds(preferences.genres)

        if (preferences.contentType.includes("movie")) {
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
      }
    }
    fetchMovies()
  }, [preferences])

  const currentMovie = movies[currentIndex]

  function handleSwipe(direction: "left" | "right") {
    if (isAnimating || !currentMovie) return

    setSwipeDirection(direction)
    setIsAnimating(true)

    if (direction === "right") {
      setLikedMovies((prev) => [...prev, currentMovie.id])

      if (user) {
        // add liked movie to user's liked movies
      }

      if (roomId && userName) {
        const matches = matchingService.addLikedMovie(userId, currentMovie.id)
        if (matches.length > 0) {
          setNewMatches((prev) => [...prev, ...matches.map((m) => m.movieId)])
          setTimeout(() => {
            setNewMatches((prev) => prev.filter((id) => id !== currentMovie.id))
          }, 5000)
        }
      }
    }

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length)
      setSwipeDirection(null)
      setIsAnimating(false)
      setShowDetails(false)
    }, 300)
  }

  if (!isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <Loader2 className="text-primary mx-auto size-8 animate-spin" />
          <h2 className="font-heading text-xl font-bold">
            Finding perfect matches...
          </h2>
          <p className="text-muted-foreground">
            Loading personalized recommendations
          </p>
        </div>
      </div>
    )
  }

  if (!currentMovie) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <h2 className="font-heading text-2xl font-bold">
            No more recommendations!
          </h2>
          <p className="text-muted-foreground">
            Check back later for more movies and shows.
          </p>
          <Button onClick={() => setCurrentIndex(0)} variant="outline">
            Start Over
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-sm space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold">SceneIt</h1>
          <div className="flex items-center gap-4">
            {roomId && (
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="size-4" />
                <span>{roomId}</span>
              </div>
            )}
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{movies.length}</span>
            </div>
          </div>
        </div>

        {user && (
          <div className="text-center">
            <Badge
              variant={user.isGuest ? "secondary" : "default"}
              className="text-xs"
            >
              {user.isGuest
                ? `Guest: ${user.name}`
                : `Signed in as ${user.name}`}
            </Badge>
          </div>
        )}

        {newMatches.includes(currentMovie?.id) && (
          <Card className="bg-primary/10 border-primary/25">
            <CardContent className="p-4 text-center">
              <div className="text-primary flex items-center justify-center gap-2">
                <Heart className="size-5 fill-current" />
                <span className="font-semibold">It&&apos;s a Match!</span>
              </div>
              <p className="text-primary/80 text-sm">
                You and your friends both love this {currentMovie?.type}!
              </p>
            </CardContent>
          </Card>
        )}

        <div className="relative h-[600px]">
          <Card
            ref={cardRef}
            className={cn(
              "absolute inset-0 overflow-hidden py-0 transition-transform duration-300",
              swipeDirection === "left"
                ? "-translate-x-full rotate-12 opacity-0"
                : swipeDirection === "right"
                  ? "translate-x-full rotate-12 opacity-0"
                  : "",
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
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            disabled={isAnimating}
            onClick={() => handleSwipe("left")}
            size="lg"
            variant="outline"
            className="hover:border-destructive/50! hover:bg-destructive/10! size-14 rounded-full border-2 bg-transparent p-0"
          >
            <X className="text-destructive size-6" />
          </Button>

          <Button
            onClick={() => setShowDetails(!showDetails)}
            size="lg"
            variant="outline"
            className="size-12 rounded-full border-2 bg-transparent p-0"
          >
            <Info className="size-5" />
          </Button>

          <Button
            disabled={isAnimating}
            onClick={() => handleSwipe("right")}
            size="lg"
            variant="outline"
            className="hover:border-primary/50! hover:bg-primary/10! size-14 rounded-full border-2 p-0"
          >
            <Heart className="text-primary size-6" />
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
          <p>Swipe right to like, left to pass</p>
          <p className="text-xs">Use arrow keys or tap buttons</p>
          {user?.isGuest && (
            <p className="text-destructive text-xs">
              Guest mode: Preferences won&apos;t be saved
            </p>
          )}
        </div>

        {likedMovies.length > 0 && (
          <div className="text-muted-foreground text-center text-xs">
            {likedMovies.length} movies liked
            {roomId && newMatches.length > 0 && (
              <>
                <Dot className="inline" />
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
