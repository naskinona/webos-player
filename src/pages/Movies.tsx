import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService, UnifiedMediaItem } from '../services/api';
import { getImageUrl, formatVoteAverage, getYear } from '../types/tmdb';
import { LoadingSpinner, SkeletonRow } from '../components/UI/LoadingSpinner';

interface CategoryRow {
  id: string;
  title: string;
  items: UnifiedMediaItem[];
  fetchMore?: () => Promise<UnifiedMediaItem[]>;
}

export function Movies() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="movies"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      }
    },
  });

  const fetchMovies = async () => {
    try {
      const [
        trending,
        popular,
        topRated,
        nowPlaying,
        upcoming,
        action,
        adventure,
        comedy,
        crime,
        documentary,
        drama,
        family,
        fantasy,
        horror,
        mystery,
        romance,
        sciFi,
        thriller,
        war,
        western,
      ] = await Promise.all([
        tmdbService.getTrending('movie', 'week'),
        tmdbService.getPopularMovies(1),
        tmdbService.getTopRatedMovies(1),
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getUpcomingMovies(1),
        tmdbService.getMoviesByGenre(28, 1),
        tmdbService.getMoviesByGenre(12, 1),
        tmdbService.getMoviesByGenre(35, 1),
        tmdbService.getMoviesByGenre(80, 1),
        tmdbService.getMoviesByGenre(99, 1),
        tmdbService.getMoviesByGenre(18, 1),
        tmdbService.getMoviesByGenre(10751, 1),
        tmdbService.getMoviesByGenre(14, 1),
        tmdbService.getMoviesByGenre(27, 1),
        tmdbService.getMoviesByGenre(9648, 1),
        tmdbService.getMoviesByGenre(10749, 1),
        tmdbService.getMoviesByGenre(878, 1),
        tmdbService.getMoviesByGenre(53, 1),
        tmdbService.getMoviesByGenre(10752, 1),
        tmdbService.getMoviesByGenre(37, 1),
      ]);

      const categoryRows: CategoryRow[] = [
        { id: 'trending', title: 'Trending This Week', items: trending.slice(0, 20), fetchMore: () => tmdbService.getTrending('movie', 'week') },
        { id: 'popular', title: 'Popular Movies', items: popular.slice(0, 20), fetchMore: () => tmdbService.getPopularMovies(2) },
        { id: 'top-rated', title: 'Top Rated Movies', items: topRated.slice(0, 20), fetchMore: () => tmdbService.getTopRatedMovies(2) },
        { id: 'now-playing', title: 'Now Playing', items: nowPlaying.slice(0, 20), fetchMore: () => tmdbService.getNowPlayingMovies(2) },
        { id: 'upcoming', title: 'Upcoming', items: upcoming.slice(0, 20), fetchMore: () => tmdbService.getUpcomingMovies(2) },
        { id: 'action', title: 'Action', items: action.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(28, 2) },
        { id: 'adventure', title: 'Adventure', items: adventure.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(12, 2) },
        { id: 'comedy', title: 'Comedy', items: comedy.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(35, 2) },
        { id: 'crime', title: 'Crime', items: crime.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(80, 2) },
        { id: 'documentary', title: 'Documentary', items: documentary.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(99, 2) },
        { id: 'drama', title: 'Drama', items: drama.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(18, 2) },
        { id: 'family', title: 'Family', items: family.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(10751, 2) },
        { id: 'fantasy', title: 'Fantasy', items: fantasy.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(14, 2) },
        { id: 'horror', title: 'Horror', items: horror.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(27, 2) },
        { id: 'mystery', title: 'Mystery', items: mystery.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(9648, 2) },
        { id: 'romance', title: 'Romance', items: romance.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(10749, 2) },
        { id: 'sci-fi', title: 'Science Fiction', items: sciFi.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(878, 2) },
        { id: 'thriller', title: 'Thriller', items: thriller.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(53, 2) },
        { id: 'war', title: 'War', items: war.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(10752, 2) },
        { id: 'western', title: 'Western', items: western.slice(0, 20), fetchMore: () => tmdbService.getMoviesByGenre(37, 2) },
      ];

      setRows(categoryRows);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const renderRow = (row: CategoryRow, index: number) => {
    if (row.items.length === 0) return null;

    return (
      <section
        key={row.id}
        data-nav-row={`row-${index}`}
        data-nav-container="movies"
        style={{ padding: '0 60px 40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{row.title}</h2>
          {row.fetchMore && (
            <Link
              to={`/movies/${row.id}`}
              data-focusable
              data-nav-row={`row-${index}`}
              style={{
                fontSize: '14px',
                color: '#999',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              See All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollSnapType: 'x mandatory',
          }}
          role="list"
          aria-label={row.title}
        >
          {row.items.map((item, itemIndex) => (
            <Link
              key={`${row.id}-${item.id}`}
              to={`/detail/${item.type}/${item.id}`}
              data-focusable
              data-nav-row={`row-${index}`}
              data-detail-link={`/detail/${item.type}/${item.id}`}
              style={{
                flexShrink: 0,
                width: '200px',
                scrollSnapAlign: 'start',
                textDecoration: 'none',
                color: 'inherit',
              }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <div style={{ position: 'relative', transition: 'transform 0.2s ease' }}>
                <img
                  src={getImageUrl(item.poster_path, 'w342')}
                  alt={item.title || item.name}
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    transition: 'transform 0.2s ease',
                  }}
                  loading="lazy"
                />
                {item.vote_average > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: item.vote_average >= 7.5 ? '#46d369' : item.vote_average >= 6 ? '#e2e23c' : '#e50914',
                    }}
                  >
                    {formatVoteAverage(item.vote_average)}
                  </div>
                )}
                {item.release_date && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#fff',
                    }}
                  >
                    {getYear(item.release_date)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div
      ref={containerRef}
      data-nav-container="movies"
      style={{ width: '100%', minHeight: '100%', paddingTop: '20px' }}
    >
      {loading ? (
        Array.from({ length: 10 }).map((_, index) => (
          <section key={index} style={{ padding: '0 60px 40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Loading...</h2>
            <SkeletonRow count={8} />
          </section>
        ))
      ) : (
        rows.map((row, index) => renderRow(row, index))
      )}
    </div>
  );
}