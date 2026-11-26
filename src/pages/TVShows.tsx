import React, { useEffect, useState } from 'react';
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

export function TVShows() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="tvshows"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      }
    },
  });

  const fetchTVShows = async () => {
    try {
      const [
        trending,
        popular,
        topRated,
        onTheAir,
        airingToday,
        action,
        adventure,
        animation,
        comedy,
        crime,
        documentary,
        drama,
        family,
        kids,
        mystery,
        news,
        reality,
        sciFi,
        soap,
        talk,
        war,
        western,
      ] = await Promise.all([
        tmdbService.getTrending('tv', 'week'),
        tmdbService.getPopularTVShows(1),
        tmdbService.getTopRatedTVShows(1),
        tmdbService.getOnTheAirTVShows(1),
        tmdbService.discoverTVShows({ 'air_date.gte': new Date().toISOString().split('T')[0], sort_by: 'popularity.desc' }),
        tmdbService.getTVShowsByGenre(10759, 1), // Action & Adventure
        tmdbService.getTVShowsByGenre(12, 1), // Adventure
        tmdbService.getTVShowsByGenre(16, 1), // Animation
        tmdbService.getTVShowsByGenre(35, 1), // Comedy
        tmdbService.getTVShowsByGenre(80, 1), // Crime
        tmdbService.getTVShowsByGenre(99, 1), // Documentary
        tmdbService.getTVShowsByGenre(18, 1), // Drama
        tmdbService.getTVShowsByGenre(10751, 1), // Family
        tmdbService.getTVShowsByGenre(10762, 1), // Kids
        tmdbService.getTVShowsByGenre(9648, 1), // Mystery
        tmdbService.getTVShowsByGenre(10763, 1), // News
        tmdbService.getTVShowsByGenre(10764, 1), // Reality
        tmdbService.getTVShowsByGenre(878, 1), // Sci-Fi & Fantasy
        tmdbService.getTVShowsByGenre(10766, 1), // Soap
        tmdbService.getTVShowsByGenre(10767, 1), // Talk
        tmdbService.getTVShowsByGenre(10768, 1), // War & Politics
        tmdbService.getTVShowsByGenre(37, 1), // Western
      ]);

      const categoryRows: CategoryRow[] = [
        { id: 'trending', title: 'Trending This Week', items: trending.slice(0, 20), fetchMore: () => tmdbService.getTrending('tv', 'week') },
        { id: 'popular', title: 'Popular TV Shows', items: popular.slice(0, 20), fetchMore: () => tmdbService.getPopularTVShows(2) },
        { id: 'top-rated', title: 'Top Rated TV Shows', items: topRated.slice(0, 20), fetchMore: () => tmdbService.getTopRatedTVShows(2) },
        { id: 'on-the-air', title: 'On The Air', items: onTheAir.slice(0, 20), fetchMore: () => tmdbService.getOnTheAirTVShows(2) },
        { id: 'airing-today', title: 'Airing Today', items: airingToday.slice(0, 20) },
        { id: 'action-adventure', title: 'Action & Adventure', items: action.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(10759, 2) },
        { id: 'animation', title: 'Animation', items: animation.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(16, 2) },
        { id: 'comedy', title: 'Comedy', items: comedy.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(35, 2) },
        { id: 'crime', title: 'Crime', items: crime.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(80, 2) },
        { id: 'documentary', title: 'Documentary', items: documentary.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(99, 2) },
        { id: 'drama', title: 'Drama', items: drama.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(18, 2) },
        { id: 'family', title: 'Family', items: family.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(10751, 2) },
        { id: 'kids', title: 'Kids', items: kids.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(10762, 2) },
        { id: 'mystery', title: 'Mystery', items: mystery.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(9648, 2) },
        { id: 'reality', title: 'Reality TV', items: reality.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(10764, 2) },
        { id: 'sci-fi-fantasy', title: 'Sci-Fi & Fantasy', items: sciFi.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(878, 2) },
        { id: 'talk', title: 'Talk Shows', items: talk.slice(0, 20), fetchMore: () => tmdbService.getTVShowsByGenre(10767, 2) },
      ];

      setRows(categoryRows);
    } catch (error) {
      console.error('Failed to fetch TV shows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTVShows();
  }, []);

  const renderRow = (row: CategoryRow, index: number) => {
    if (row.items.length === 0) return null;

    return (
      <section
        key={row.id}
        data-nav-row={`row-${index}`}
        data-nav-container="tvshows"
        style={{ padding: '0 60px 40px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>{row.title}</h2>
          {row.fetchMore && (
            <Link
              to={`/tv-shows/${row.id}`}
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
                {item.first_air_date && (
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
                    {getYear(item.first_air_date)}
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
      data-nav-container="tvshows"
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