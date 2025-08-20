"use client"

import { ChevronRight, Film, Heart, Star } from "lucide-react"
import { useState } from "react"

import { PreferencesSetup } from "@/components/preferences-setup"
import { RoomSetup } from "@/components/room-setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    title: "Swipe. Match. Watch.",
    description: "Find your perfect movie or show with SceneIt",
    icon: <Film className="text-primary size-16" />,
    action: "Get Started",
  },
  {
    title: "Swipe to Match",
    description:
      "Swipe right on movies you'd love to watch, left on ones you'd skip",
    icon: <Heart className="text-primary size-16" />,
    action: "Got it",
  },
  {
    title: "Find Common Ground",
    description:
      "When you and a friend both swipe right, you've found your next watch together",
    icon: <Star className="text-primary size-16" />,
    action: "Start Matching",
  },
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState<number>(0)

  function handleNextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Move to preferences setup
      setCurrentStep(3)
    }
  }

  if (currentStep < 3) {
    const step = STEPS[currentStep]

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* UserMenu */}

        <Card className="mx-auto w-full max-w-md">
          <CardContent className="space-y-6 p-8 text-center">
            <div className="flex justify-center">{step.icon}</div>

            <div className="space-y-3">
              <h1 className="text-foreground font-heading text-2xl font-bold">
                {step.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed text-balance">
                {step.description}
              </p>
            </div>

            <div className="flex justify-center space-x-2 py-4">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    index === currentStep
                      ? "bg-primary"
                      : "bg-muted-foreground/25",
                  )}
                />
              ))}
            </div>

            <Button onClick={handleNextStep} size="lg" className="w-full">
              {step.action}
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === 3) {
    return (
      <>
        <PreferencesSetup setCurrentStep={setCurrentStep} />
      </>
    )
  }

  if (currentStep === 4) {
    return (
      <>
        <RoomSetup />
      </>
    )
  }
}
