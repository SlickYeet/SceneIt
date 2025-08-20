"use client"

import type { User } from "better-auth"
import { Loader2, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { tmdbService, type Movie } from "@/lib/tmdb"

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
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

  if (currentMovie) {
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
      </div>
    </div>
  )
}
