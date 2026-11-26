import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  TMDB_CONFIG,
  TMDBMovie,
  TMDBTVShow,
  TMDBGenre,
  TMDBVideo,
  TMDBCredits,
  TMDBDetailsMovie,
  TMDBDetailsTVShow,
  TMDBSearchResult,
  TMDBGenreList,
  TMDBSeason,
  TMDBEpisode,
  UnifiedMediaItem,
  MediaType,
} from '../types/tmdb';

class TMDBService {
  private client: AxiosInstance;
  private genreCache: Map<string, TMDBGenre[]> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: TMDB_CONFIG.baseUrl,
      params: {
        api_key: TMDB_CONFIG.apiKey,
        language: 'en-US',
      },
      timeout: 10000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('TMDB API Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params });
    return response.data;
  }

  async getGenres(type: MediaType = 'movie'): Promise<TMDBGenre[]> {
    const cacheKey = `genres_${type}`;
    if (this.genreCache.has(cacheKey)) {
      return this.genreCache.get(cacheKey)!;
    }

    const data = await this.get<TMDBGenreList>(`/genre/${type}/list`);
    this.genreCache.set(cacheKey, data.genres);
    return data.genres;
  }

  async getGenreNames(genreIds: number[], type: MediaType = 'movie'): Promise<string[]> {
    const genres = await this.getGenres(type);
    return genreIds.map(id => genres.find(g => g.id === id)?.name).filter(Boolean) as string[];
  }

  // Trending
  async getTrending(type: MediaType = 'all', timeWindow: 'day' | 'week' = 'week'): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/trending/${type}/${timeWindow}`);
    return data.results.map(item => ({
      ...item,
      type: 'media_type' in item ? item.media_type : type,
    } as UnifiedMediaItem));
  }

  // Popular
  async getPopularMovies(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/popular`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async getPopularTVShows(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/tv/popular`, { page });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Top Rated
  async getTopRatedMovies(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/top_rated`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async getTopRatedTVShows(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/tv/top_rated`, { page });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Now Playing / On Air
  async getNowPlayingMovies(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/now_playing`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async getOnTheAirTVShows(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/tv/on_the_air`, { page });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Upcoming
  async getUpcomingMovies(page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/upcoming`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  // Details
  async getMovieDetails(id: number): Promise<TMDBDetailsMovie> {
    return this.get<TMDBDetailsMovie>(`/movie/${id}`, {
      append_to_response: 'videos,credits,recommendations,similar',
    });
  }

  async getTVShowDetails(id: number): Promise<TMDBDetailsTVShow> {
    return this.get<TMDBDetailsTVShow>(`/tv/${id}`, {
      append_to_response: 'videos,credits,recommendations,similar',
    });
  }

  // Videos
  async getMovieVideos(id: number): Promise<TMDBVideo[]> {
    const data = await this.get<{ results: TMDBVideo[] }>(`/movie/${id}/videos`);
    return data.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
  }

  async getTVShowVideos(id: number): Promise<TMDBVideo[]> {
    const data = await this.get<{ results: TMDBVideo[] }>(`/tv/${id}/videos`);
    return data.results.filter(v => v.site === 'YouTube' && v.type === 'Trailer');
  }

  // Credits
  async getMovieCredits(id: number): Promise<TMDBCredits> {
    return this.get<TMDBCredits>(`/movie/${id}/credits`);
  }

  async getTVShowCredits(id: number): Promise<TMDBCredits> {
    return this.get<TMDBCredits>(`/tv/${id}/credits`);
  }

  // Recommendations
  async getMovieRecommendations(id: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/${id}/recommendations`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async getTVShowRecommendations(id: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/tv/${id}/recommendations`, { page });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Similar
  async getSimilarMovies(id: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/movie/${id}/similar`, { page });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async getSimilarTVShows(id: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/tv/${id}/similar`, { page });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Search
  async searchMulti(query: string, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/search/multi`, { query, page, include_adult: false });
    return data.results
      .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
      .map(item => ({ ...item, type: item.media_type }));
  }

  async searchMovies(query: string, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/search/movie`, { query, page, include_adult: false });
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async searchTVShows(query: string, page: number = 1): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/search/tv`, { query, page, include_adult: false });
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // Discover
  async discoverMovies(params: Record<string, any> = {}): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/discover/movie`, params);
    return data.results.map(item => ({ ...item, type: 'movie' as MediaType }));
  }

  async discoverTVShows(params: Record<string, any> = {}): Promise<UnifiedMediaItem[]> {
    const data = await this.get<TMDBSearchResult>(`/discover/tv`, params);
    return data.results.map(item => ({ ...item, type: 'tv' as MediaType }));
  }

  // By Genre
  async getMoviesByGenre(genreId: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    return this.discoverMovies({ with_genres: genreId, page, sort_by: 'popularity.desc' });
  }

  async getTVShowsByGenre(genreId: number, page: number = 1): Promise<UnifiedMediaItem[]> {
    return this.discoverTVShows({ with_genres: genreId, page, sort_by: 'popularity.desc' });
  }

  // Season details
  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<{ episodes: TMDBEpisode[] }> {
    return this.get(`/tv/${tvId}/season/${seasonNumber}`);
  }

  // Episode details
  async getEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number): Promise<TMDBEpisode> {
    return this.get(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
  }

  // Person details
  async getPersonDetails(personId: number): Promise<any> {
    return this.get(`/person/${personId}`, { append_to_response: 'movie_credits,tv_credits' });
  }

  // Image URL helpers
  getPosterUrl(path: string | null, size: string = 'w342'): string {
    if (!path) return '';
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
  }

  getBackdropUrl(path: string | null, size: string = 'w1280'): string {
    if (!path) return '';
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
  }

  getProfileUrl(path: string | null, size: string = 'w185'): string {
    if (!path) return '';
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
  }

  getLogoUrl(path: string | null, size: string = 'w300'): string {
    if (!path) return '';
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
  }

  // YouTube trailer URL
  getTrailerUrl(videos: TMDBVideo[]): string | null {
    const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (!trailer) return null;
    return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0`;
  }
}

export const tmdbService = new TMDBService();
export default tmdbService;