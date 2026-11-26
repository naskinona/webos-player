import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { tmdbService } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface PlayerControls {
  playPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleFullscreen: () => void;
  toggleMute: () => void;
  nextEpisode: () => void;
  previousEpisode: () => void;
}

export function Player() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { currentProfile, updateContinueWatchingProgress, addToContinueWatching } = useAppContext();

  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressUpdateRef = useRef<NodeJS.Timeout>();
  const mediaId = parseInt(id || '0', 10);
  const mediaType = type as 'movie' | 'tv';

  const { containerRef, focusedElement, navigate: spatialNavigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="player"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      const action = focusedElement?.dataset.action;
      if (action === 'play-pause') {
        togglePlayPause();
      } else if (action === 'mute') {
        toggleMute();
      } else if (action === 'fullscreen') {
        toggleFullscreen();
      } else if (action === 'skip-back') {
        seek(currentTime - 10);
      } else if (action === 'skip-forward') {
        seek(currentTime + 30);
      } else if (action === 'next-episode') {
        nextEpisode();
      } else if (action === 'previous-episode') {
        previousEpisode();
      } else if (action === 'exit') {
        navigate(-1);
      }
    },
    onBack: () => navigate(-1),
  });

  // Fetch video URL (in real app, this would be from your streaming service)
  const fetchVideoSource = useCallback(async () => {
    try {
      // For demo, we'll use a sample video. In production, you'd get this from your streaming backend
      // This is a placeholder - real implementation would use DRM-protected streams
      const videos = mediaType === 'movie'
        ? await tmdbService.getMovieVideos(mediaId)
        : await tmdbService.getTVShowVideos(mediaId);

      // For demo purposes, we'll use a sample video
      // In production, replace with actual streaming URL from your backend
      setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'); // HLS test stream
    } catch (err) {
      console.error('Failed to fetch video source:', err);
      // Fallback to test stream
      setVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
    } finally {
      setLoading(false);
    }
  }, [mediaId, mediaType]);

  useEffect(() => {
    fetchVideoSource();
  }, [fetchVideoSource]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Resume from saved position
      if (currentProfile) {
        // In real app, fetch saved progress from backend
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  };

  const handlePlay = () => setPlaying(true);
  const handlePause = () => setPlaying(false);
  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    // Auto-play next episode for TV shows
    if (mediaType === 'tv') {
      nextEpisode();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', e);
    setError('Unable to play video. Please try again later.');
  };

  // Save progress periodically
  useEffect(() => {
    if (!currentProfile || !videoRef.current) return;

    progressUpdateRef.current = setInterval(() => {
      if (videoRef.current && playing) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        updateContinueWatchingProgress(
          `${mediaType}_${mediaId}`,
          progress,
          videoRef.current.currentTime
        );
      }
    }, 10000); // Save every 10 seconds

    return () => {
      if (progressUpdateRef.current) clearInterval(progressUpdateRef.current);
      // Save final position
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        updateContinueWatchingProgress(
          `${mediaType}_${mediaId}`,
          progress,
          videoRef.current.currentTime
        );
      }
    };
  }, [currentProfile, mediaId, mediaType, playing, updateContinueWatchingProgress]);

  // Controls auto-hide
  useEffect(() => {
    if (showControls && playing) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, playing]);

  const showControlsHandler = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  // Player controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, videoRef.current.duration));
    }
  };

  const setVolume = (vol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, vol));
      setVolumeState(videoRef.current.volume);
      setMuted(videoRef.current.volume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen().catch(console.error);
      }
    }
  };

  const nextEpisode = () => {
    // In real app, fetch next episode and navigate
    console.log('Next episode');
  };

  const previousEpisode = () => {
    // In real app, fetch previous episode and navigate
    console.log('Previous episode');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 30);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            navigate(-1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, volume, navigate]);

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div
        ref={containerRef}
        data-nav-container="player"
        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}
      >
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>▶</div>
          <div>Loading video...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        ref={containerRef}
        data-nav-container="player"
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', padding: '40px', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Playback Error</h1>
        <p style={{ color: '#999', marginBottom: '24px' }}>{error}</p>
        <button
          data-focusable
          data-nav-row="error"
          data-action="exit"
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

  return (
    <div
      ref={containerRef}
      data-nav-container="player"
      style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}
      onMouseMove={showControlsHandler}
      onMouseEnter={showControlsHandler}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        playsInline
        crossOrigin="anonymous"
      />

      {/* Controls Overlay */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 40px 40px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 100%)',
            zIndex: 10,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {/* Progress Bar */}
          <div
            style={{
              position: 'relative',
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              marginBottom: '16px',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seek(percent * duration);
            }}
            onMouseMove={(e) => {
              // Show preview tooltip
            }}
          >
            {/* Buffered */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${duration > 0 ? (buffered / duration) * 100 : 0}%`,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '2px',
              }}
            />
            {/* Progress */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                background: '#e50914',
                borderRadius: '2px',
                transition: 'width 0.1s linear',
              }}
            />
            {/* Playhead */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                background: '#fff',
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}
            />
          </div>

          {/* Time Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#ccc' }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div
            data-nav-row="player-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="skip-back"
              aria-label="Rewind 10 seconds"
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/></svg>
            </button>

            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="previous-episode"
              aria-label="Previous Episode"
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/><path d="M16.5 0l8.5 6-8.5 6V0z"/></svg>
            </button>

            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="play-pause"
              aria-label={playing ? 'Pause' : 'Play'}
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '32px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              {playing ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="next-episode"
              aria-label="Next Episode"
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/><path d="M16.5 0l8.5 6-8.5 6V0z"/></svg>
            </button>

            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="skip-forward"
              aria-label="Forward 30 seconds"
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5-6l8.5 6-8.5 6V0z"/></svg>
            </button>
          </div>

          {/* Volume & Fullscreen */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                data-focusable
                data-nav-row="player-controls"
                data-action="mute"
                aria-label={muted ? 'Unmute' : 'Mute'}
                style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                {muted || volume === 0 ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{
                  width: '100px',
                  accentColor: '#e50914',
                  cursor: 'pointer',
                }}
              />
            </div>

            <button
              data-focusable
              data-nav-row="player-controls"
              data-action="fullscreen"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{ padding: '8px', background: 'transparent', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
            >
              {fullscreen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Exit Button Top Left */}
      <button
        data-focusable
        data-nav-row="player-controls"
        data-action="exit"
        aria-label="Exit Player"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 20,
          padding: '10px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '50%',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          display: showControls ? 'flex' : 'none',
        }}
        onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}