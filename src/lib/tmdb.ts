import { env } from "@/env"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

export interface TMDBMovie {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  genre_ids: number[]
  runtime?: number
  number_of_seasons?: number
  media_type?: "movie" | "tv"
}

export interface Movie {
  id: number
  title: string
  poster: string
  year: string
  rating: number
  runtime: string
  genres: string[]
  overview: string
  type: "movie" | "tv"
}

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV specific genres
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
}

class TMDBService {
  private apiKey: string

  constructor() {
    this.apiKey = env.NEXT_PUBLIC_TMDB_API_KEY
  }

  private async fetchFromTMDB(endpoint: string): Promise<any> {
    const separator = endpoint.includes("?") ? "&" : "?"
    const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${this.apiKey}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(
        `TMDB API error: ${response.status} - ${response.statusText}`,
      )
      const errorText = await response.text()
      console.error("Error details:", errorText)
      throw new Error(`TMDB API error: ${response.status}`)
    }
    return response.json()
  }

  private transformTMDBToMovie(item: TMDBMovie, type: "movie" | "tv"): Movie {
    const title = item.title || item.name || "Untitled"
    const year =
      item.release_date?.split("-")[0] ||
      item.first_air_date?.split("-")[0] ||
      "N/A"
    const poster = item.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}`
      : "https://placehold.co/600x400?text=No+Image"
    const genres = item.genre_ids.map((id) => GENRE_MAP[id]).filter(Boolean)

    let runtime = "Unknown"
    if (type === "movie" && item.runtime) {
      runtime = `${item.runtime} min`
    } else if (type === "tv" && item.number_of_seasons) {
      runtime = `${item.number_of_seasons} season${item.number_of_seasons > 1 ? "s" : ""}`
    }

    return {
      id: item.id,
      title,
      poster,
      year,
      rating: Math.round(item.vote_average * 10) / 10,
      runtime,
      genres,
      overview: item.overview || "No description available.",
      type,
    }
  }

  async getPopularMovies(page = 1): Promise<Movie[]> {
    try {
      const data = await this.fetchFromTMDB(`/movie/popular?page=${page}`)
      return data.results.map((movie: TMDBMovie) =>
        this.transformTMDBToMovie(movie, "movie"),
      )
    } catch (error) {
      console.error("Error fetching movies:", error)
      return []
    }
  }

  async getPopularTVShows(page = 1): Promise<Movie[]> {
    try {
      const data = await this.fetchFromTMDB(`/tv/popular?page=${page}`)
      return data.results.map((show: TMDBMovie) =>
        this.transformTMDBToMovie(show, "tv"),
      )
    } catch (error) {
      console.error("Error fetching TV shows:", error)
      return []
    }
  }

  async getMoviesByGenre(genreIds: number[], page = 1): Promise<Movie[]> {
    try {
      const genreString = genreIds.join(",")
      const data = await this.fetchFromTMDB(
        `/discover/movie?with_genres=${genreString}&page=${page}&sort_by=popularity.desc`,
      )
      return data.results.map((movie: TMDBMovie) =>
        this.transformTMDBToMovie(movie, "movie"),
      )
    } catch (error) {
      console.error("Error fetching movies by genre:", error)
      return []
    }
  }

  async getTVShowsByGenre(genreIds: number[], page = 1): Promise<Movie[]> {
    try {
      const genreString = genreIds.join(",")
      const data = await this.fetchFromTMDB(
        `/discover/tv?with_genres=${genreString}&page=${page}&sort_by=popularity.desc`,
      )
      return data.results.map((show: TMDBMovie) =>
        this.transformTMDBToMovie(show, "tv"),
      )
    } catch (error) {
      console.error("Error fetching TV shows by genre:", error)
      return []
    }
  }

  getGenreIds(genreNames: string[]): number[] {
    const genreEntries = Object.entries(GENRE_MAP)
    return genreNames
      .map((name) => {
        const entry = genreEntries.find(
          ([_, genreName]) => genreName.toLowerCase() === name.toLowerCase(),
        )
        return entry ? Number.parseInt(entry[0]) : null
      })
      .filter((id): id is number => id !== null)
  }
}

export const tmdbService = new TMDBService()
