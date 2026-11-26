import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSpatialNavigation } from '../../hooks/useSpatialNavigation';
import { useAppContext } from '../../context/AppContext';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/movies', label: 'Movies', icon: '🎬' },
  { path: '/tv-shows', label: 'TV Shows', icon: '📺' },
  { path: '/my-list', label: 'My List', icon: '❤️' },
  { path: '/search', label: 'Search', icon: '🔍' },
];

export function Header() {
  const location = useLocation();
  const { currentProfile, profiles, setCurrentProfile, addProfile, deleteProfile } = useAppContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const newProfileNameRef = useRef<HTMLInputElement>(null);

  const { containerRef, focusedElement, navigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="header"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      if (focusedElement?.dataset.action === 'profile') {
        setShowProfileMenu(true);
      } else if (focusedElement?.dataset.action === 'add-profile') {
        setShowAddProfile(true);
      } else if (focusedElement?.dataset.action === 'confirm-add-profile') {
        const name = newProfileNameRef.current?.value.trim();
        if (name) {
          addProfile(name);
          setShowAddProfile(false);
          newProfileNameRef.current!.value = '';
        }
      } else if (focusedElement?.dataset.action === 'delete-profile') {
        const profileId = focusedElement.dataset.profileId;
        if (profileId && window.confirm('Delete this profile?')) {
          deleteProfile(profileId);
          setShowProfileMenu(false);
        }
      } else if (focusedElement?.dataset.action === 'switch-profile') {
        const profileId = focusedElement.dataset.profileId;
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
          setCurrentProfile(profile);
          setShowProfileMenu(false);
        }
      } else if (focusedElement?.dataset.path) {
        window.location.href = focusedElement.dataset.path;
      }
    },
    onBack: () => {
      if (showAddProfile) {
        setShowAddProfile(false);
        newProfileNameRef.current!.value = '';
      } else if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    },
  });

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
        setShowAddProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showAddProfile) {
        setShowAddProfile(false);
        newProfileNameRef.current!.value = '';
        e.preventDefault();
      } else if (showProfileMenu) {
        setShowProfileMenu(false);
        e.preventDefault();
      }
    }
  };

  return (
    <header
      ref={containerRef}
      data-nav-container="header"
      className="header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 1000,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Logo */}
      <Link
        to="/"
        data-focusable
        data-nav-row="main"
        data-action="navigate"
        data-path="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0',
          color: '#e50914',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-1px',
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
      >
        <span style={{ fontSize: '32px' }}>N</span>
        <span>Netflix</span>
      </Link>

      {/* Navigation */}
      <nav data-nav-row="main" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {NAV_ITEMS.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            data-focusable
            data-nav-row="main"
            data-action="navigate"
            data-path={item.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '4px',
              color: location.pathname === item.path ? '#fff' : '#e5e5e5',
              fontSize: '16px',
              fontWeight: location.pathname === item.path ? 600 : 400,
              textDecoration: 'none',
              transition: 'color 0.2s, background 0.2s',
              background: location.pathname === item.path ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
            }}
            onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Profile Menu */}
      <div
        data-nav-row="main"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          data-focusable
          data-nav-row="main"
          data-action="profile"
          aria-haspopup="true"
          aria-expanded={showProfileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px 6px 6px',
            borderRadius: '4px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          {currentProfile ? (
            <>
              <img
                src={currentProfile.avatar}
                alt={currentProfile.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: 500 }}>{currentProfile.name}</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginLeft: '4px', color: '#999' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </>
          ) : (
            <span style={{ fontSize: '16px', color: '#999' }}>Sign In</span>
          )}
        </button>

        {showProfileMenu && (
          <div
            ref={profileMenuRef}
            data-nav-row="profile-menu"
            data-nav-container="profile-menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: '280px',
              background: '#141414',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              zIndex: 1001,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {currentProfile ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #333', marginBottom: '16px' }}>
                  <img
                    src={currentProfile.avatar}
                    alt={currentProfile.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>{currentProfile.name}</div>
                    <div style={{ fontSize: '13px', color: '#999' }}>{currentProfile.isKids ? 'Kids Profile' : 'Adult Profile'}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Other Profiles</div>
                  {profiles.filter(p => p.id !== currentProfile?.id).map(profile => (
                    <button
                      key={profile.id}
                      data-focusable
                      data-nav-row="profile-menu"
                      data-action="switch-profile"
                      data-profile-id={profile.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontSize: '15px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span>{profile.name}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #333', paddingTop: '16px' }}>
                  <button
                    data-focusable
                    data-nav-row="profile-menu"
                    data-action="add-profile"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '4px',
                      background: '#333',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                  >
                    <span style={{ fontSize: '20px' }}>+</span>
                    Add Profile
                  </button>
                  <button
                    data-focusable
                    data-nav-row="profile-menu"
                    data-action="delete-profile"
                    data-profile-id={currentProfile.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '4px',
                      background: 'transparent',
                      border: '1px solid #e50914',
                      color: '#e50914',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                  >
                    Delete
                  </button>
                </div>

                <button
                  data-focusable
                  data-nav-row="profile-menu"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#999',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                >
                  Close
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '16px', marginBottom: '16px' }}>Sign in to access your profiles</div>
                <button
                  data-focusable
                  data-nav-row="profile-menu"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    background: '#e50914',
                    border: 'none',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Add Profile Modal */}
        {showAddProfile && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => { setShowAddProfile(false); newProfileNameRef.current!.value = ''; }}
          >
            <div
              data-nav-container="add-profile-modal"
              data-nav-row="add-profile"
              style={{
                background: '#141414',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '32px',
                minWidth: '400px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Add Profile</h2>
              <p style={{ color: '#999', marginBottom: '24px', fontSize: '15px' }}>Enter a name for the new profile</p>
              <input
                ref={newProfileNameRef}
                type="text"
                placeholder="Profile name"
                maxLength={20}
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '4px',
                  background: '#333',
                  border: '1px solid #444',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none',
                  marginBottom: '24px',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const name = e.currentTarget.value.trim();
                    if (name) {
                      addProfile(name);
                      setShowAddProfile(false);
                      e.currentTarget.value = '';
                    }
                  } else if (e.key === 'Escape') {
                    setShowAddProfile(false);
                    e.currentTarget.value = '';
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  data-focusable
                  data-nav-row="add-profile"
                  onClick={() => { setShowAddProfile(false); newProfileNameRef.current!.value = ''; }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '4px',
                    background: 'transparent',
                    border: '1px solid #333',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                >
                  Cancel
                </button>
                <button
                  data-focusable
                  data-nav-row="add-profile"
                  data-action="confirm-add-profile"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '4px',
                    background: '#e50914',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}