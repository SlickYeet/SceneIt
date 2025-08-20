"use client"

import { Film, Tv } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { usePreferences } from "@/hooks/use-preferences"

interface PreferencesSetupProps {
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
}

export function PreferencesSetup({ setCurrentStep }: PreferencesSetupProps) {
  const [preferences, setPreferences] = usePreferences()

  const [selectedContentType, setSelectedContentType] = useState<
    typeof preferences.contentType
  >([])
  const [selectedGenre, setSelectedGenre] = useState<typeof preferences.genres>(
    [],
  )

  const CONTENT_TYPES = [
    { id: "movies", label: "Movies", icon: <Film className="size-5" /> },
    { id: "tv", label: "TV Shows", icon: <Tv className="size-5" /> },
  ]

  const GENRE_OPTIONS = [
    "Action",
    "Comedy",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Documentary",
    "Animation",
    "Fantasy",
    "Crime",
    "Adventure",
  ]

  function toggleContentType(type: (typeof preferences.contentType)[number]) {
    setSelectedContentType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  function toggleGenre(genre: (typeof preferences.genres)[number]) {
    setSelectedGenre((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    )
  }

  const canProceed = selectedContentType.length > 0 && selectedGenre.length > 0

  function handleStart() {
    const newPreferences = {
      contentType: selectedContentType,
      genres: selectedGenre,
    }
    setPreferences(newPreferences)
    setCurrentStep(4) // Movie to room setup
  }

  function handleSkip() {
    const defaultPreferences: typeof preferences = {
      contentType: ["movies", "tv"],
      genres: ["Action", "Comedy", "Drama"],
    }
    setPreferences(defaultPreferences)
    setCurrentStep(4)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-md space-y-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-foreground font-heading text-2xl font-bold">
            What do you want to watch?
          </h1>
          <p className="text-muted-foreground text-balance">
            Select your preferences to get personalized recommendations
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <h3 className="text-foreground font-heading font-semibold">
                Content Type
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    onClick={() =>
                      toggleContentType(
                        type.id as (typeof preferences.contentType)[number],
                      )
                    }
                    variant={
                      selectedContentType.includes(
                        type.id as (typeof preferences.contentType)[number],
                      )
                        ? "default"
                        : "outline"
                    }
                    className="h-12 justify-start gap-2 border"
                  >
                    {type.icon}
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-foreground font-heading font-semibold">
                Favorite Genres
              </h3>
              <p className="text-muted-foreground text-sm">
                Select at least one genre
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GENRE_OPTIONS.map((genre) => (
                  <Button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    variant={
                      selectedGenre.includes(genre) ? "default" : "outline"
                    }
                    size="sm"
                    className="h-10 border"
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          disabled={!canProceed}
          onClick={handleStart}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>

        <div className="text-muted-foreground text-center">
          <Button onClick={handleSkip} size="sm" variant="ghost">
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
