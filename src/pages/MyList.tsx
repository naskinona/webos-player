import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService, UnifiedMediaItem } from '../services/api';
import { getImageUrl, formatVoteAverage, getYear } from '../types/tmdb';
import { useAppContext } from '../context/AppContext';
import { LoadingSpinner, SkeletonRow } from '../components/UI/LoadingSpinner';

export function MyList() {
  const { myList, isLoading } = useAppContext();
  const [items, setItems] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="mylist"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      }
    },
  });

  const fetchMyList = async () => {
    if (myList.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const results: UnifiedMediaItem[] = [];
      for (const mediaKey of myList) {
        const [type, idStr] = mediaKey.split('_');
        const id = parseInt(idStr, 10);
        if (type === 'movie') {
          const details = await tmdbService.getMovieDetails(id);
          results.push({ ...details, type: 'movie' });
        } else if (type === 'tv') {
          const details = await tmdbService.getTVShowDetails(id);
          results.push({ ...details, type: 'tv' });
        }
      }
      setItems(results);
    } catch (error) {
      console.error('Failed to fetch My List:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyList();
  }, [myList]);

  if (isLoading || loading) {
    return (
      <div
        ref={containerRef}
        data-nav-container="mylist"
        style={{ width: '100%', minHeight: '100%', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-nav-container="mylist"
      style={{ width: '100%', minHeight: '100%', padding: '60px' }}
    >
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>My List</h1>
        <p style={{ color: '#999', fontSize: '16px' }}>
          {items.length} {items.length === 1 ? 'title' : 'titles'}
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '24px', opacity: 0.5 }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Your List is Empty</h2>
          <p style={{ marginBottom: '24px' }}>Add movies and TV shows to watch later</p>
          <Link
            to="/"
            data-focusable
            data-nav-row="empty-state"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: '#e50914',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Explore Content
          </Link>
        </div>
      ) : (
        <section data-nav-row="mylist" data-nav-container="mylist">
          <div
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollSnapType: 'x mandatory',
            }}
            role="list"
            aria-label="My List"
          >
            {items.map((item, index) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={`/detail/${item.type}/${item.id}`}
                data-focusable
                data-nav-row="mylist"
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
                  {(item.release_date || item.first_air_date) && (
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
                      {getYear(item.release_date || item.first_air_date || '')}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}