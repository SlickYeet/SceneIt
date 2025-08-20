import { SwipingInterface } from "@/components/swiping-interface"

export default function HomePage() {
  const preferences = {
    contentType: ["movie", "tv"],
    genres: ["Action", "Comedy"],
  }
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

  return <SwipingInterface preferences={preferences} roomId="123" user={user} />
}
