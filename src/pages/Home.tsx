import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService, UnifiedMediaItem } from '../services/api';
import { getImageUrl, formatVoteAverage } from '../types/tmdb';
import { LoadingSpinner, SkeletonRow } from '../components/UI/LoadingSpinner';

interface ContentRow {
  id: string;
  title: string;
  items: UnifiedMediaItem[];
  fetchMore?: () => Promise<UnifiedMediaItem[]>;
}

export function Home() {
  const [heroItem, setHeroItem] = useState<UnifiedMediaItem | null>(null);
  const [heroDetails, setHeroDetails] = useState<any>(null);
  const [contentRows, setContentRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroLoading, setHeroLoading] = useState(true);

  const { containerRef, focusedElement, navigate, focusElement, initialize } = useSpatialNavigation({
    containerSelector: '[data-nav-container="home"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      } else if (focusedElement?.dataset.playLink) {
        window.location.href = focusedElement.dataset.playLink;
      }
    },
  });

  const fetchHeroContent = useCallback(async () => {
    try {
      const trending = await tmdbService.getTrending('all', 'week');
      if (trending.length > 0) {
        const hero = trending[0];
        setHeroItem(hero);

        // Fetch details for hero
        if (hero.type === 'movie') {
          const details = await tmdbService.getMovieDetails(hero.id);
          setHeroDetails(details);
        } else {
          const details = await tmdbService.getTVShowDetails(hero.id);
          setHeroDetails(details);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hero content:', error);
    } finally {
      setHeroLoading(false);
    }
  }, []);

  const fetchContentRows = useCallback(async () => {
    try {
      const [
        trending,
        popularMovies,
        popularTV,
        topRatedMovies,
        topRatedTV,
        actionMovies,
        comedyMovies,
        dramaMovies,
        sciFiMovies,
        horrorMovies,
        documentaryMovies,
      ] = await Promise.all([
        tmdbService.getTrending('all', 'week'),
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1),
        tmdbService.getTopRatedMovies(1),
        tmdbService.getTopRatedTVShows(1),
        tmdbService.getMoviesByGenre(28, 1), // Action
        tmdbService.getMoviesByGenre(35, 1), // Comedy
        tmdbService.getMoviesByGenre(18, 1), // Drama
        tmdbService.getMoviesByGenre(878, 1), // Sci-Fi
        tmdbService.getMoviesByGenre(27, 1), // Horror
        tmdbService.getMoviesByGenre(99, 1), // Documentary
      ]);

      const rows: ContentRow[] = [
        {
          id: 'continue-watching',
          title: 'Continue Watching',
          items: [], // Will be filled from context
        },
        {
          id: 'trending',
          title: 'Trending Now',
          items: trending.slice(1, 15),
        },
        {
          id: 'popular-movies',
          title: 'Popular Movies',
          items: popularMovies.slice(0, 15),
          fetchMore: () => tmdbService.getPopularMovies(2),
        },
        {
          id: 'popular-tv',
          title: 'Popular TV Shows',
          items: popularTV.slice(0, 15),
          fetchMore: () => tmdbService.getPopularTVShows(2),
        },
        {
          id: 'top-rated-movies',
          title: 'Top Rated Movies',
          items: topRatedMovies.slice(0, 15),
          fetchMore: () => tmdbService.getTopRatedMovies(2),
        },
        {
          id: 'top-rated-tv',
          title: 'Top Rated TV Shows',
          items: topRatedTV.slice(0, 15),
          fetchMore: () => tmdbService.getTopRatedTVShows(2),
        },
        {
          id: 'action',
          title: 'Action Movies',
          items: actionMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(28, 2),
        },
        {
          id: 'comedy',
          title: 'Comedy Movies',
          items: comedyMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(35, 2),
        },
        {
          id: 'drama',
          title: 'Drama Movies',
          items: dramaMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(18, 2),
        },
        {
          id: 'sci-fi',
          title: 'Sci-Fi & Fantasy',
          items: sciFiMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(878, 2),
        },
        {
          id: 'horror',
          title: 'Horror Movies',
          items: horrorMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(27, 2),
        },
        {
          id: 'documentary',
          title: 'Documentaries',
          items: documentaryMovies.slice(0, 15),
          fetchMore: () => tmdbService.getMoviesByGenre(99, 2),
        },
      ];

      setContentRows(rows);
    } catch (error) {
      console.error('Failed to fetch content rows:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroContent();
    fetchContentRows();
  }, [fetchHeroContent, fetchContentRows]);

  const renderHero = () => {
    if (heroLoading) {
      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '600px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <LoadingSpinner size="large" />
        </div>
      );
    }

    if (!heroItem || !heroDetails) return null;

    const backdropUrl = getImageUrl(heroDetails.backdrop_path, 'original', 'backdrop');
    const posterUrl = getImageUrl(heroDetails.poster_path, 'w500');

    return (
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          minHeight: '600px',
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '80px',
          paddingLeft: '60px',
        }}
      >
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, #000 100%)',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', animation: 'slideUp 0.5s ease' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '14px', color: '#999' }}>
            {heroDetails.genres?.slice(0, 3).map((genre: any, i: number) => (
              <span key={genre.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && <span>•</span>}
                {genre.name}
              </span>
            ))}
            {heroDetails.release_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                • {getYear(heroDetails.release_date)}
              </span>
            )}
            {heroDetails.first_air_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                • {getYear(heroDetails.first_air_date)}
              </span>
            )}
            {heroDetails.runtime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                • {formatRuntime(heroDetails.runtime)}
              </span>
            )}
            {heroDetails.number_of_seasons && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                • {heroDetails.number_of_seasons} Seasons
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              • {heroDetails.vote_average ? formatVoteAverage(heroDetails.vote_average) : formatVoteAverage(heroItem.vote_average)} Match
            </span>
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.1, marginBottom: '16px', maxWidth: '900px' }}>
            {heroDetails.title || heroDetails.name || heroItem.title || heroItem.name}
          </h1>

          <p style={{ fontSize: '20px', lineHeight: 1.5, color: '#e5e5e5', marginBottom: '24px', maxWidth: '700px' }}>
            {heroDetails.overview || heroItem.overview}
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to={`/player/${heroItem.type}/${heroItem.id}`}
              data-focusable
              data-nav-row="hero"
              data-play-link={`/player/${heroItem.type}/${heroItem.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#e50914',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.2s',
                minWidth: '180px',
              }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Play
            </Link>

            <Link
              to={`/detail/${heroItem.type}/${heroItem.id}`}
              data-focusable
              data-nav-row="hero"
              data-detail-link={`/detail/${heroItem.type}/${heroItem.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(109, 109, 110, 0.7)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.2s',
                minWidth: '180px',
              }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              More Info
            </Link>
          </div>
        </div>
      </section>
    );
  };

  const renderContentRow = (row: ContentRow, index: number) => {
    if (row.items.length === 0 && row.id !== 'continue-watching') return null;

    return (
      <section
        key={row.id}
        data-nav-row={`row-${index}`}
        data-nav-container="home"
        style={{ padding: '0 60px 40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{row.title}</h2>
          {row.fetchMore && (
            <Link
              to={`/browse/${row.id}`}
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
            WebkitOverflowScrolling: 'touch',
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
      data-nav-container="home"
      style={{ width: '100%', minHeight: '100%' }}
    >
      {renderHero()}
      {loading ? (
        contentRows.map((_, index) => (
          <section key={index} style={{ padding: '0 60px 40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Loading...</h2>
            <SkeletonRow count={8} />
          </section>
        ))
      ) : (
        contentRows.map((row, index) => renderContentRow(row, index))
      )}
    </div>
  );
}

function getYear(dateString: string): string {
  if (!dateString) return '';
  return dateString.split('-')[0];
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}