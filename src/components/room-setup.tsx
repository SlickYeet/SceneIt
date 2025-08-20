"use client"

import { LogIn, Plus } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRoom } from "@/hooks/use-room"

export function RoomSetup() {
  const [_, setRoom] = useRoom()

  const [userName, setUserName] = useState<string>("")
  const [roomCode, setRoomCode] = useState<string>("")
  const [roomName, setRoomName] = useState<string>("")
  const [mode, setMode] = useState<"create" | "join" | null>(null)

  function handleCreateRoom() {
    if (!userName.trim() || !roomName.trim()) return
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoom({
      id: newRoomCode,
      name: roomName.trim(),
      code: newRoomCode,
      userName: [userName.trim()],
    })
  }

  function handleJoinRoom() {
    if (!userName.trim() || !roomCode.trim()) return
    setRoom({
      id: roomCode.trim().toUpperCase(),
      name: `Room ${roomCode.trim().toUpperCase()}`,
      code: roomCode.trim().toUpperCase(),
      userName: [userName.trim()],
    })
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
          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
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
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => setMode(null)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              disabled={
                !userName.trim() ||
                (mode === "create" ? !roomName.trim() : !roomCode.trim())
              }
              onClick={mode === "create" ? handleCreateRoom : handleJoinRoom}
              className="flex-1"
            >
              {mode === "create" ? "Create" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
