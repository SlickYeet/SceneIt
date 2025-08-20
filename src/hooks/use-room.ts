import { User } from "better-auth"
import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

type Room = {
  id: string
  name: string
  code: string
  userName: Array<User["name"] | string>
}

const roomAtom = atomWithStorage<Room>("room", {
  id: "",
  name: "",
  code: "",
  userName: [],
})

export function useRoom() {
  return useAtom(roomAtom)
}
