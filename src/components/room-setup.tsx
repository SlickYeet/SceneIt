"use client"

import { LogIn, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRoom } from "@/hooks/use-room"

export function RoomSetup() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setRoom] = useRoom()
  const wsRef = useRef<WebSocket | null>(null)

  const [userName, setUserName] = useState<string>("")
  const [roomCode, setRoomCode] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")
  const [mode, setMode] = useState<"create" | "join" | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const ws = new WebSocket(
      `${window.location.origin.replace(/^http/, "ws")}/ws`,
    )
    wsRef.current = ws

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data)

        if (msg.type === "roomCreated") {
          setIsLoading(false)
          if (msg.success) {
            setRoom({
              id: msg.room.id,
              name: msg.room.name,
              code: msg.room.code,
              userName: [userName.trim()],
            })
          } else {
            setError(msg.error || "Failed to create room")
          }
        }

        if (msg.type === "roomChecked") {
          setIsLoading(false)
          if (msg.success) {
            setRoom({
              id: msg.room.id,
              name: msg.room.name,
              code: msg.room.code,
              userName: [userName.trim()],
            })
          } else {
            setError("Room not found. Please check the room code.")
          }
        }
      } catch (error) {
        console.error("WS message error:", error)
        setIsLoading(false)
        setError("Connection error occurred")
      }
    })

    ws.addEventListener("error", () => {
      setIsLoading(false)
      setError("Could not connect to server")
    })

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [userName, setRoom])

  function handleCreateRoom() {
    if (!userName.trim() || !roomName.trim()) return

    setIsLoading(true)
    setError("")

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "createRoom",
          roomName: roomName.trim(),
        }),
      )
    } else {
      setIsLoading(false)
      setError("Not connected to server")
    }
  }

  function handleJoinRoom() {
    if (!userName.trim() || !roomCode.trim()) return

    setIsLoading(true)
    setError("")

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "checkRoom",
          roomCode: roomCode.trim().toUpperCase(),
        }),
      )
    } else {
      setIsLoading(false)
      setError("Not connected to server")
    }
  }

  if (!mode) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="font-heading text-2xl font-bold">Find Your Match</h1>
            <p className="text-muted-foreground text-balance">
              Create or join a room to start matching movies with friends
            </p>
          </div>

          <div className="space-y-4">
            <Card
              onClick={() => setMode("create")}
              className="hover:bg-accent/80 cursor-pointer transition-colors"
            >
              <CardContent className="space-y-3 p-6 text-center">
                <div className="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-full">
                  <Plus className="text-primary size-6" />
                </div>
                <h3 className="font-heading font-semibold">Create Room</h3>
                <p className="text-muted-foreground text-sm text-balance">
                  Start a new matching session with friends
                </p>
              </CardContent>
            </Card>

            <Card
              onClick={() => setMode("join")}
              className="hover:bg-accent/80 cursor-pointer"
            >
              <CardContent className="space-y-3 p-6 text-center">
                <div className="bg-primary/10 mx-auto flex size-12 items-center justify-center rounded-full">
                  <LogIn className="text-primary size-6" />
                </div>
                <h3 className="font-heading font-semibold">Join Room</h3>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter a room code to join existing session
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-center">
            {mode === "create" ? "Create Room" : "Join Room"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-destructive bg-destructive/10 border-destructive/20 rounded-md border p-3 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>

          {mode === "create" ? (
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                placeholder="Movie Night, Date Night, etc."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="roomCode">Room Code</Label>
              <Input
                id="roomCode"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                setMode(null)
                setError("")
              }}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              disabled={
                isLoading ||
                !userName.trim() ||
                (mode === "create" ? !roomName.trim() : !roomCode.trim())
              }
              onClick={mode === "create" ? handleCreateRoom : handleJoinRoom}
              className="flex-1"
            >
              {isLoading ? "..." : mode === "create" ? "Create" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
