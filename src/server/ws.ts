import WebSocket, { WebSocketServer } from "ws"

import { matchingService } from "@/lib/matching"

type ClientMeta = { userId?: string; roomId?: string; userName?: string }

const PORT = Number(process.env.WS_PORT) || 4000

const wss = new WebSocketServer({ port: PORT })
const clients = new Map<WebSocket, ClientMeta>()

console.log(`WS server listening on ws://localhost:${PORT}`)

wss.on("connection", (ws) => {
  clients.set(ws, {})

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(String(data))
      const meta = clients.get(ws) || {}

      if (msg.type === "createRoom" && msg.roomName) {
        const room = matchingService.createRoom(msg.roomName)
        console.log(`Created room ${room.id}: ${room.name}`)
        ws.send(
          JSON.stringify({
            type: "roomCreated",
            success: true,
            room: {
              id: room.id,
              name: room.name,
              code: room.id,
            },
          }),
        )
      }

      if (msg.type === "checkRoom" && msg.roomCode) {
        const room = matchingService.getRoom(msg.roomCode.toUpperCase())
        if (room) {
          console.log(`Room ${msg.roomCode} found`)
          ws.send(
            JSON.stringify({
              type: "roomChecked",
              success: true,
              room: {
                id: room.id,
                name: room.name,
                code: room.id,
              },
            }),
          )
        } else {
          console.log(`Room ${msg.roomCode} not found`)
          ws.send(
            JSON.stringify({
              type: "roomChecked",
              success: false,
              error: "Room not found",
            }),
          )
        }
      }

      if (
        msg.type === "likedMovie" &&
        msg.movieId &&
        msg.userId &&
        msg.roomId
      ) {
        console.log(
          `User ${msg.userId} liked movie ${msg.movieId} in room ${msg.roomId}`,
        )

        const matches = matchingService.addLikedMovie(msg.userId, msg.movieId)
        if (matches.length > 0) {
          console.log(`Found ${matches.length} new matches!`)
        }
      }

      if (msg.type === "join" && msg.roomId) {
        meta.userId = msg.userId
        meta.roomId = msg.roomId
        meta.userName = msg.userName || msg.userId
        clients.set(ws, meta)

        const joined = matchingService.joinRoom(
          msg.roomId,
          msg.userId,
          meta.userName || msg.userId || "anonymous",
          { contentType: [], genres: [] },
        )

        if (joined) {
          console.log(`User ${msg.userId} joined room ${msg.roomId}`)
          ws.send(
            JSON.stringify({
              type: "joined",
              roomId: msg.roomId,
              success: true,
            }),
          )
        } else {
          console.log(`User ${msg.userId} failed to join room ${msg.roomId}`)
          ws.send(
            JSON.stringify({
              type: "joined",
              roomId: msg.roomId,
              success: false,
              error: "Room not found or inactive",
            }),
          )
        }
      }
      // TODO: handle other client messages
    } catch (error) {
      // ignore malformed
      console.error("Malformed WS message", error)
    }
  })

  ws.on("close", () => {
    const meta = clients.get(ws)
    if (meta?.roomId && meta?.userId) {
      matchingService.leaveRoom(meta.roomId, meta.userId)
      console.log(`User ${meta.userId} left room ${meta.roomId}`)
    }
    clients.delete(ws)
  })
})

matchingService.addOnMatchListener((roomId, match) => {
  const payload = JSON.stringify({ type: "match", roomId, match })
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    }
  }
})
