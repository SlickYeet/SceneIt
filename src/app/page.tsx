"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Onboarding } from "@/components/onboarding"
import { SwipingInterface } from "@/components/swiping-interface"
import { usePreferences } from "@/hooks/use-preferences"
import { useRoom } from "@/hooks/use-room"

export default function HomePage() {
  const [preferences] = usePreferences()
  const [room] = useRoom()

  const [isHydrated, setIsHydrated] = useState(false)

  const user = {
    id: "user-123",
    name: "John Doe",
    email: "john.doe@example.com",
    emailVerified: true,
    image: "https://example.com/avatar.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
    isGuest: true,
  }

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <Loader2 className="text-primary mx-auto size-8 animate-spin" />
          <h2 className="font-heading text-xl font-bold">Loading SceneIt...</h2>
        </div>
      </div>
    )
  }

  const hasCompletedOnboarding =
    preferences.contentType.length > 0 &&
    preferences.genres.length > 0 &&
    room.id

  if (!hasCompletedOnboarding) {
    return <Onboarding />
  }

  return <SwipingInterface roomId={room.id} user={user} />
}
