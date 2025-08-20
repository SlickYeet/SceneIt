export interface UserSession {
  id: string
  name: string
  likedMovies: number[]
  preferences: {
    contentType: string[]
    genres: string[]
  }
  createdAt: Date
}

export interface Match {
  movieId: number
  users: string[]
  matchedAt: Date
}
export interface Room {
  id: string
  name: string
  users: UserSession[]
  matches: Match[]
}

class MatchingService {
  private rooms: Map<string, Room> = new Map()
  private userSession: Map<string, UserSession> = new Map()

  addLikedMovie(userId: string, movieId: number): Match[] {
    const user = this.userSession.get(userId)
    if (!user) return []

    if (!user.likedMovies.includes(movieId)) {
      user.likedMovies.push(movieId)
    }

    const userRooms = Array.from(this.rooms.values()).filter((room) =>
      room.users.some((u) => u.id === userId),
    )

    const newMatches: Match[] = []

    userRooms.forEach((room) => {
      const usersWhoLikedMovie = room.users.filter((u) =>
        u.likedMovies.includes(movieId),
      )

      if (usersWhoLikedMovie.length >= 2) {
        const existingMatch = room.matches.find(
          (m) =>
            m.movieId === movieId &&
            m.users.length === usersWhoLikedMovie.length &&
            m.users.every((userId) =>
              usersWhoLikedMovie.some((u) => u.id === userId),
            ),
        )

        if (!existingMatch) {
          const match: Match = {
            movieId,
            users: usersWhoLikedMovie.map((u) => u.id),
            matchedAt: new Date(),
          }
          room.matches.push(match)
          newMatches.push(match)
        }
      }
    })

    return newMatches
  }
}

export const matchingService = new MatchingService()
