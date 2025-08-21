import { NextRequest, NextResponse } from "next/server"

import { matchingService } from "@/lib/matching"

export async function POST(request: NextRequest) {
  try {
    const { action, roomName, roomCode } = await request.json()

    if (action === "create") {
      if (!roomName) {
        return NextResponse.json(
          { error: "Room name is required" },
          { status: 400 },
        )
      }

      const room = matchingService.createRoom(roomName)
      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          code: room.id,
        },
      })
    }

    if (action === "check") {
      if (!roomCode) {
        return NextResponse.json(
          { error: "Room code is required" },
          { status: 400 },
        )
      }

      const room = matchingService.getRoom(roomCode.toUpperCase())
      if (!room) {
        return NextResponse.json(
          {
            success: false,
            error: "Room not found",
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        room: {
          id: room.id,
          name: room.name,
          code: room.id,
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Room API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
