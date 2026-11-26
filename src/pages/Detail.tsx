import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService } from '../services/api';
import { getImageUrl, getYear, formatRuntime, formatVoteAverage } from '../types/tmdb';
import { LoadingSpinner, SkeletonCard } from '../components/UI/LoadingSpinner';
import { useAppContext } from '../context/AppContext';

export function Detail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { currentProfile, addToContinueWatching, addToMyList, removeFromMyList, isInMyList } = useAppContext();

  const [details, setDetails] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [credits, setCredits] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  const mediaId = parseInt(id || '0', 10);
  const mediaType = type as 'movie' | 'tv';

  const { containerRef, focusedElement, navigate: spatialNavigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="detail"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.playLink) {
        window.location.href = focusedElement.dataset.playLink;
      } else if (focusedElement?.dataset.detailLink) {
        window.location.href = focusedElement.dataset.detailLink;
      } else if (focusedElement?.dataset.action === 'mylist') {
        toggleMyList();
      }
    },
    onBack: () => navigate(-1),
  });

  const fetchDetails = async () => {
    try {
      setLoading(true);
      if (mediaType === 'movie') {
        const data = await tmdbService.getMovieDetails(mediaId);
        setDetails(data);
        setVideos(data.videos?.results || []);
        setCredits(data.credits);
        setRecommendations(data.recommendations?.results || []);
        setSimilar(data.similar?.results || []);
      } else {
        const data = await tmdbService.getTVShowDetails(mediaId);
        setDetails(data);
        setVideos(data.videos?.results || []);
        setCredits(data.credits);
        setRecommendations(data.recommendations?.results || []);
        setSimilar(data.similar?.results || []);
      }

      // Find trailer
      const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      if (trailer) {
        setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0`);
      }
    } catch (err) {
      console.error('Failed to fetch details:', err);
      setError('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [mediaId, mediaType]);

  const toggleMyList = () => {
    if (!currentProfile) return;
    const mediaKey = `${mediaType}_${mediaId}`;
    if (isInMyList(mediaKey)) {
      removeFromMyList(mediaKey);
    } else {
      addToMyList(mediaKey);
    }
  };

  const handlePlay = () => {
    if (currentProfile) {
      const item = {
        mediaId: `${mediaType}_${mediaId}`,
        mediaType,
        title: details?.title || details?.name || '',
        posterPath: details?.poster_path,
        backdropPath: details?.backdrop_path,
        progress: 0,
        currentTime: 0,
        duration: details?.runtime || details?.episode_run_time?.[0] || 0,
        lastWatched: Date.now(),
      };
      addToContinueWatching(item);
    }
    navigate(`/player/${mediaType}/${mediaId}`);
  };

  if (loading) {
    return (
      <div
        ref={containerRef}
        data-nav-container="detail"
        style={{ width: '100%', minHeight: '100%', padding: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div
        ref={containerRef}
        data-nav-container="detail"
        style={{ width: '100%', minHeight: '100%', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Unable to Load</h1>
        <p style={{ color: '#999', marginBottom: '24px' }}>{error || 'Content not found'}</p>
        <button
          data-focusable
          data-nav-row="error"
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            background: '#e50914',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
        >
          Go Back
        </button>
      </div>
    );
  }

  const backdropUrl = getImageUrl(details.backdrop_path, 'original', 'backdrop');
  const posterUrl = getImageUrl(details.poster_path, 'w500');
  const isInList = isInMyList(`${mediaType}_${mediaId}`);

  const genres = details.genres?.map((g: any) => g.name).join(' • ') || '';
  const releaseYear = getYear(details.release_date || details.first_air_date);
  const runtime = details.runtime ? formatRuntime(details.runtime) : details.episode_run_time?.[0] ? formatRuntime(details.episode_run_time[0]) : '';
  const seasons = details.number_of_seasons ? `${details.number_of_seasons} Seasons` : '';
  const rating = formatVoteAverage(details.vote_average);

  return (
    <div
      ref={containerRef}
      data-nav-container="detail"
      style={{ width: '100%', minHeight: '100%' }}
    >
      {/* Hero Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: -2,
          filter: 'blur(80px)',
          transform: 'scale(1.1)',
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div style={{ padding: '60px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header with Poster and Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '40px',
            marginBottom: '40px',
            alignItems: 'start',
          }}
        >
          {/* Poster */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <img
              src={posterUrl}
              alt={details.title || details.name}
              style={{
                width: '100%',
                aspectRatio: '2/3',
                objectFit: 'cover',
                borderRadius: '8px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            />
            {trailerUrl && (
              <button
                data-focusable
                data-nav-row="detail-header"
                data-play-link={`/player/${mediaType}/${mediaId}`}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#e50914',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 10px 20px rgba(229, 9, 20, 0.4)',
                }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play Trailer
              </button>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '14px', color: '#999' }}>
              {releaseYear && <span>{releaseYear}</span>}
              {releaseYear && genres && <span>•</span>}
              {genres && <span>{genres}</span>}
              {genres && runtime && <span>•</span>}
              {runtime && <span>{runtime}</span>}
              {runtime && seasons && <span>•</span>}
              {seasons && <span>{seasons}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: rating >= 7.5 ? '#46d369' : rating >= 6 ? '#e2e23c' : '#e50914' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {rating}
              </span>
            </div>

            <h1 style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1.1, marginBottom: '16px', maxWidth: '800px' }}>
              {details.title || details.name}
            </h1>

            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#e5e5e5', marginBottom: '24px', maxWidth: '700px' }}>
              {details.overview || 'No description available.'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <button
                data-focusable
                data-nav-row="detail-header"
                onClick={handlePlay}
                data-play-link={`/player/${mediaType}/${mediaId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: '#e50914',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  minWidth: '160px',
                }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Play
              </button>

              <button
                data-focusable
                data-nav-row="detail-header"
                data-action="mylist"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: isInList ? '#e50914' : 'rgba(109, 109, 110, 0.7)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  minWidth: '160px',
                }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isInList ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {isInList ? 'In My List' : 'Add to My List'}
              </button>
            </div>

            {/* Cast */}
            {credits?.cast && credits.cast.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Cast</div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {credits.cast.slice(0, 6).map((actor: any, i: number) => (
                    <Link
                      key={actor.id}
                      to={`/person/${actor.id}`}
                      data-focusable
                      data-nav-row="detail-header"
                      data-detail-link={`/person/${actor.id}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        color: 'inherit',
                        width: '100px',
                      }}
                      onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                    >
                      <img
                        src={actor.profile_path ? getImageUrl(actor.profile_path, 'w185', 'profile') : 'https://via.placeholder.com/100x100/333/999?text=No+Image'}
                        alt={actor.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <span style={{ fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                        {actor.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trailer */}
        {trailerUrl && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Trailer</h2>
            <div style={{ position: 'relative', width: '100%', maxWidth: '800px', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                src={trailerUrl}
                title={`${details.title || details.name} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Sections */}
        <ContentSection
          title="More Like This"
          items={similar.slice(0, 15)}
          onItemClick={(item) => navigate(`/detail/${item.type}/${item.id}`)}
        />

        <ContentSection
          title="Recommendations"
          items={recommendations.slice(0, 15)}
          onItemClick={(item) => navigate(`/detail/${item.type}/${item.id}`)}
        />
      </div>
    </div>
  );
}

function ContentSection({ title, items, onItemClick }: { title: string; items: any[]; onItemClick: (item: any) => void }) {
  const { focusedElement, focusElement } = useSpatialNavigation({
    containerSelector: `[data-section="${title}"]`,
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.itemId) {
        const item = items.find(i => `${i.type}_${i.id}` === focusedElement.dataset.itemId);
        if (item) onItemClick(item);
      }
    },
  });

  if (items.length === 0) return null;

  return (
    <section
      ref={focusedElement ? undefined : (el: HTMLElement | null) => {}}
      data-section={title}
      data-nav-container={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ marginBottom: '40px' }}
    >
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>{title}</h2>
      <div
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory',
        }}
        role="list"
        aria-label={title}
      >
        {items.map((item, index) => (
          <Link
            key={`${item.type}-${item.id}`}
            to={`/detail/${item.type}/${item.id}`}
            data-focusable
            data-nav-row={`${title.toLowerCase().replace(/\s+/g, '-')}`}
            data-item-id={`${item.type}_${item.id}`}
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
                src={item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/200x300/333/999?text=No+Image'}
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
}