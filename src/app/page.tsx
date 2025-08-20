import { SwipingInterface } from "@/components/swiping-interface"

export default function HomePage() {
  const preferences = {
    contentType: ["movie", "tv"],
    genres: ["Action", "Comedy"],
  }

  return <SwipingInterface preferences={preferences} roomId="123" />
}
