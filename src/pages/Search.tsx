import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService, UnifiedMediaItem } from '../services/api';
import { getImageUrl, formatVoteAverage, getYear } from '../types/tmdb';
import { LoadingSpinner, SkeletonRow } from '../components/UI/LoadingSpinner';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="search"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      } else if (focusedElement?.dataset.searchQuery) {
        setQuery(focusedElement.dataset.searchQuery);
        handleSearch(focusedElement.dataset.searchQuery);
      }
    },
    onBack: () => {
      if (showResults) {
        setShowResults(false);
      }
    },
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('netflix_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches', e);
      }
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      const data = await tmdbService.searchMulti(searchQuery.trim());
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    const timeout = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value.trim();
      if (value) {
        // Save to recent searches
        setRecentSearches(prev => {
          const filtered = prev.filter(s => s !== value);
          const updated = [value, ...filtered].slice(0, 10);
          localStorage.setItem('netflix_recent_searches', JSON.stringify(updated));
          return updated;
        });
        handleSearch(value);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      e.currentTarget.blur();
    }
  };

  const handleFocus = () => {
    if (query.trim()) {
      setShowResults(true);
    } else if (recentSearches.length > 0) {
      setShowResults(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow clicks on results
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div
      ref={containerRef}
      data-nav-container="search"
      style={{ width: '100%', minHeight: '100%', padding: '60px' }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Search Header */}
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>Search</h1>

        {/* Search Input */}
        <div
          style={{
            position: 'relative',
            marginBottom: '32px',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Search for movies, TV shows, actors..."
            autoComplete="off"
            spellCheck={false}
            data-focusable
            data-nav-row="search-input"
            style={{
              width: '100%',
              padding: '18px 20px 18px 56px',
              fontSize: '18px',
              background: '#141414',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#fff',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
                searchInputRef.current?.focus();
              }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '8px',
                background: 'transparent',
                color: '#999',
                cursor: 'pointer',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Results or Recent Searches */}
        {(showResults && (query.trim() || recentSearches.length > 0)) && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#141414',
              border: '1px solid #333',
              borderRadius: '8px',
              marginTop: '8px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              zIndex: 100,
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            {loading && query.trim() ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner size="medium" />
              </div>
            ) : query.trim() ? (
              results.length > 0 ? (
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px', padding: '0 16px' }}>
                    {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '16px',
                      padding: '0 16px 16px',
                    }}
                    role="list"
                  >
                    {results.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={`/detail/${item.type}/${item.id}`}
                        data-focusable
                        data-nav-row="search-results"
                        data-detail-link={`/detail/${item.type}/${item.id}`}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                        onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                      >
                        <div style={{ position: 'relative' }}>
                          <img
                            src={getImageUrl(item.poster_path, 'w220')}
                            alt={item.title || item.name}
                            style={{
                              width: '100%',
                              aspectRatio: '2/3',
                              objectFit: 'cover',
                              borderRadius: '4px',
                            }}
                            loading="lazy"
                          />
                          <div style={{ padding: '8px 0 0' }}>
                            <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title || item.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span>{item.type === 'movie' ? 'Movie' : 'TV Show'}</span>
                              {item.release_date || item.first_air_date ? (
                                <span>• {getYear(item.release_date || item.first_air_date || '')}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  <p>No results found for "{query}"</p>
                </div>
              )
            ) : recentSearches.length > 0 ? (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 16px' }}>
                  <span style={{ fontSize: '14px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Searches</span>
                  <button
                    data-focusable
                    data-nav-row="recent-searches"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem('netflix_recent_searches');
                    }}
                    style={{
                      fontSize: '13px',
                      color: '#e50914',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  {recentSearches.map((search, index) => (
                    <button
                      key={search}
                      data-focusable
                      data-nav-row="recent-searches"
                      data-search-query={search}
                      onClick={() => {
                        setQuery(search);
                        handleSearch(search);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '15px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#999', flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{search}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#666' }}>
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Full Results Page */}
        {showResults && query.trim() && results.length > 0 && (
          <section data-nav-row="full-results" data-nav-container="search" style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
              Results for "{query}" ({results.length})
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
              }}
              role="list"
            >
              {results.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={`/detail/${item.type}/${item.id}`}
                  data-focusable
                  data-nav-row="full-results"
                  data-detail-link={`/detail/${item.type}/${item.id}`}
                  style={{
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
                    <div style={{ padding: '8px 0 0' }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title || item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span>{item.type === 'movie' ? 'Movie' : 'TV Show'}</span>
                        {item.release_date || item.first_air_date ? (
                          <span>• {getYear(item.release_date || item.first_air_date || '')}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!showResults && !query.trim() && recentSearches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '24px', opacity: 0.5 }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Search for Movies & TV Shows</h2>
            <p>Type in the search box above to find content</p>
          </div>
        )}
      </div>
    </div>
  );
}