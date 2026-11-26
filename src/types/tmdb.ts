export interface TMDBConfig {
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  imageSizes: {
    poster: string[];
    backdrop: string[];
    profile: string[];
    logo: string[];
  };
}

export const TMDB_CONFIG: TMDBConfig = {
  apiKey: import.meta.env.VITE_TMDB_API_KEY || '',
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
  imageSizes: {
    poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
    backdrop: ['w300', 'w780', 'w1280', 'original'],
    profile: ['w45', 'w185', 'h632', 'original'],
    logo: ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'],
  },
};

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCast[];
  crew: TMDBcrew[];
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBcrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBDetailsMovie extends TMDBMovie {
  runtime: number;
  genres: TMDBGenre[];
  videos: { results: TMDBVideo[] };
  credits: TMDBCredits;
  recommendations: { results: TMDBMovie[] };
  similar: { results: TMDBMovie[] };
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  homepage: string;
  imdb_id: string | null;
}

export interface TMDBDetailsTVShow extends TMDBTVShow {
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: TMDBGenre[];
  videos: { results: TMDBVideo[] };
  credits: TMDBCredits;
  recommendations: { results: TMDBTVShow[] };
  similar: { results: TMDBTVShow[] };
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  status: string;
  tagline: string;
  type: string;
  last_air_date: string;
  next_episode_to_air: TMDBEpisode | null;
  networks: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  seasons: TMDBSeason[];
}

export interface TMDBSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  vote_average: number;
  vote_count: number;
  air_date: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  runtime: number;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface TMDBSearchResult {
  page: number;
  results: (TMDBMovie | TMDBTVShow)[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenreList {
  genres: TMDBGenre[];
}

export type MediaType = 'movie' | 'tv';

export interface UnifiedMediaItem {
  id: number;
  type: MediaType;
  title: string;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  media_type?: MediaType;
}

export function unifyMediaItem(item: TMDBMovie | TMDBTVShow, type?: MediaType): UnifiedMediaItem {
  const mediaType = type || (item as any).media_type || ('title' in item ? 'movie' : 'tv');
  return {
    id: item.id,
    type: mediaType,
    title: 'title' in item ? item.title : '',
    name: 'name' in item ? item.name : '',
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: 'release_date' in item ? item.release_date : '',
    first_air_date: 'first_air_date' in item ? item.first_air_date : '',
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    genre_ids: item.genre_ids,
    popularity: item.popularity,
    media_type: mediaType,
  };
}

export function getImageUrl(path: string | null, size: string = 'w500', type: 'poster' | 'backdrop' | 'profile' | 'logo' = 'poster'): string {
  if (!path) return '';
  return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
}

export function getYear(dateString: string): string {
  if (!dateString) return '';
  return dateString.split('-')[0];
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatVoteAverage(vote: number): string {
  return vote.toFixed(1);
}