import { useAtom } from "jotai"
import { atomWithStorage } from "jotai/utils"

export type Preferences = {
  contentType: Array<"movies" | "tv">
  genres: Array<string>
}

const preferenceAtom = atomWithStorage<Preferences>("preferences", {
  contentType: [],
  genres: [],
})

export function usePreferences() {
  return useAtom(preferenceAtom)
}
