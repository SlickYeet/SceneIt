import { type Preferences } from "@/hooks/use-preferences"

export interface UserSession {
  id: string
  name: string
  likedMovies: number[]
  preferences: Preferences
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
  isActive: boolean
  createdAt: Date
}

class MatchingService {
  private rooms: Map<string, Room> = new Map()
  private userSession: Map<string, UserSession> = new Map()

  private onMatchCallbacks: Set<(roomId: string, match: Match) => void> =
    new Set()

  addOnMatchListener(cb: (roomId: string, match: Match) => void) {
    this.onMatchCallbacks.add(cb)
    return () => this.onMatchCallbacks.delete(cb)
  }

  private emitMatch(roomId: string, match: Match) {
    for (const cb of this.onMatchCallbacks) {
      try {
        cb(roomId, match)
      } catch (e) {
        // swallow listener errors
        console.error("Error in onMatch listener:", e)
      }
    }
  }

  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  createRoom(roomName: string): Room {
    const roomId = this.generateRoomCode()
    const room: Room = {
      id: roomId,
      name: roomName,
      users: [],
      matches: [],
      createdAt: new Date(),
      isActive: true,
    }
    this.rooms.set(roomId, room)
    return room
  }

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
            m.users.every((uid) =>
              usersWhoLikedMovie.some((u) => u.id === uid),
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
          this.emitMatch(room.id, match)
        }
      }
    })

    return newMatches
  }

  getRoomMatches(roomId: string): Match[] {
    const room = this.rooms.get(roomId)
    return room?.matches || []
  }

  getUserMatches(userId: string): { room: Room; matches: Match[] }[] {
    const userRooms = Array.from(this.rooms.values()).filter((room) =>
      room.users.some((u) => u.id === userId),
    )

    return userRooms
      .map((room) => ({
        room,
        matches: room.matches.filter((match) => match.users.includes(userId)),
      }))
      .filter((result) => result.matches.length > 0)
  }

  leaveRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId)
    if (!room) return false

    room.users = room.users.filter((u) => u.id !== userId)

    // If room is empty, mark as inactive
    if (room.users.length === 0) {
      room.isActive = false
    }

    return true
  }

  joinRoom(
    roomId: string,
    userId: string,
    userName: string,
    preferences: Preferences,
  ): boolean {
    const room = this.rooms.get(roomId)
    if (!room || !room.isActive) return false

    // Check if user is already in the room
    if (room.users.some((u) => u.id === userId)) return true

    // Add user to room
    const userSession: UserSession = {
      id: userId,
      name: userName,
      likedMovies: [],
      preferences,
      createdAt: new Date(),
    }

    room.users.push(userSession)
    this.userSession.set(userId, userSession)

    return true
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  cleanupOldRooms(maxAgeHours = 24): void {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [roomId, room] of this.rooms.entries()) {
      if (!room.isActive && room.createdAt < cutoffTime) {
        this.rooms.delete(roomId)
      }
    }
  }
}

export const matchingService = new MatchingService()
