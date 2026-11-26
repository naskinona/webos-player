import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpatialNavigation } from '../hooks/useSpatialNavigation';
import { useAppContext } from '../context/AppContext';

export function ProfileSelect() {
  const { profiles, currentProfile, setCurrentProfile, addProfile, deleteProfile } = useAppContext();
  const navigate = useNavigate();
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const newProfileInputRef = useRef<HTMLInputElement>(null);
  const editProfileInputRef = useRef<HTMLInputElement>(null);

  const { containerRef, focusedElement, navigate: spatialNavigate, focusElement } = useSpatialNavigation({
    containerSelector: '[data-nav-container="profile-select"]',
    itemSelector: '[data-focusable]',
    rowSelector: '[data-nav-row]',
    onEnter: () => {
      const action = focusedElement?.dataset.action;
      const profileId = focusedElement?.dataset.profileId;

      if (action === 'select-profile' && profileId) {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
          setCurrentProfile(profile);
          navigate('/');
        }
      } else if (action === 'add-profile') {
        setShowAddProfile(true);
        setTimeout(() => newProfileInputRef.current?.focus(), 100);
      } else if (action === 'confirm-add-profile') {
        if (newProfileName.trim()) {
          addProfile(newProfileName.trim());
          setShowAddProfile(false);
          setNewProfileName('');
        }
      } else if (action === 'edit-profile' && profileId) {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
          setEditingProfileId(profileId);
          setEditName(profile.name);
          setTimeout(() => editProfileInputRef.current?.focus(), 100);
        }
      } else if (action === 'confirm-edit-profile' && editingProfileId) {
        if (editName.trim()) {
          // In real app, update profile name via API
          console.log('Update profile name:', editingProfileId, editName);
          setEditingProfileId(null);
          setEditName('');
        }
      } else if (action === 'delete-profile' && profileId) {
        if (window.confirm('Delete this profile? This cannot be undone.')) {
          deleteProfile(profileId);
        }
      } else if (action === 'cancel-edit') {
        setEditingProfileId(null);
        setEditName('');
      } else if (action === 'cancel-add') {
        setShowAddProfile(false);
        setNewProfileName('');
      }
    },
    onBack: () => {
      if (showAddProfile) {
        setShowAddProfile(false);
        setNewProfileName('');
      } else if (editingProfileId) {
        setEditingProfileId(null);
        setEditName('');
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showAddProfile && newProfileName.trim()) {
        addProfile(newProfileName.trim());
        setShowAddProfile(false);
        setNewProfileName('');
      } else if (editingProfileId && editName.trim()) {
        console.log('Update profile name:', editingProfileId, editName);
        setEditingProfileId(null);
        setEditName('');
      }
    } else if (e.key === 'Escape') {
      if (showAddProfile) {
        setShowAddProfile(false);
        setNewProfileName('');
      } else if (editingProfileId) {
        setEditingProfileId(null);
        setEditName('');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      data-nav-container="profile-select"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        padding: '60px',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Logo */}
      <div style={{ marginBottom: '60px', textAlign: 'center' }}>
        <span style={{ fontSize: '64px', fontWeight: 700, color: '#e50914', letterSpacing: '-2px' }}>N</span>
        <h1 style={{ fontSize: '48px', fontWeight: 300, marginTop: '-16px', letterSpacing: '-1px' }}>Netflix</h1>
      </div>

      {/* Who's Watching */}
      <h2 style={{ fontSize: '32px', fontWeight: 400, marginBottom: '40px', color: '#fff' }}>Who's Watching?</h2>

      {/* Profiles Grid */}
      <div
        data-nav-row="profiles"
        style={{
          display: 'flex',
          gap: '32px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px',
        }}
      >
        {profiles.map((profile) => (
          <div
            key={profile.id}
            data-nav-row="profiles"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              width: '180px',
              position: 'relative',
            }}
          >
            <button
              data-focusable
              data-nav-row="profiles"
              data-action={editingProfileId === profile.id ? 'confirm-edit-profile' : 'select-profile'}
              data-profile-id={profile.id}
              onClick={() => {
                if (!editingProfileId) {
                  setCurrentProfile(profile);
                  navigate('/');
                }
              }}
              style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: editingProfileId === profile.id ? '4px solid #e50914' : '4px solid transparent',
                background: '#333',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                boxShadow: editingProfileId === profile.id ? '0 0 0 4px #e50914, 0 20px 40px rgba(0,0,0,0.5)' : 'none',
              }}
              onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              onDoubleClick={() => {
                setEditingProfileId(profile.id);
                setEditName(profile.name);
                setTimeout(() => editProfileInputRef.current?.focus(), 100);
              }}
            >
              <img
                src={profile.avatar}
                alt={profile.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {profile.isKids && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#e50914', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                  Kids
                </div>
              )}
              {currentProfile?.id === profile.id && (
                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.42-1.41L9 16.17z"/></svg>
                  Active
                </div>
              )}
            </button>

            {editingProfileId === profile.id ? (
              <input
                ref={editProfileInputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editName.trim()) {
                    console.log('Update profile:', profile.id, editName);
                    setEditingProfileId(null);
                  } else if (e.key === 'Escape') {
                    setEditingProfileId(null);
                    setEditName('');
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (editingProfileId === profile.id) {
                      setEditingProfileId(null);
                    }
                  }, 100);
                }}
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 500,
                  background: '#141414',
                  border: '2px solid #e50914',
                  borderRadius: '4px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 500,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }}
                >
                  {profile.name}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    data-focusable
                    data-nav-row="profiles"
                    data-action="edit-profile"
                    data-profile-id={profile.id}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'transparent',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      color: '#999',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                  >
                    Edit
                  </button>
                  <button
                    data-focusable
                    data-nav-row="profiles"
                    data-action="delete-profile"
                    data-profile-id={profile.id}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: 'transparent',
                      border: '1px solid #e50914',
                      borderRadius: '4px',
                      color: '#e50914',
                      cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Profile Button */}
        <button
          data-focusable
          data-nav-row="profiles"
          data-action="add-profile"
          onClick={() => setShowAddProfile(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: '4px dashed #333',
            background: 'transparent',
            color: '#999',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            focusElement(e.currentTarget as any, 'mouse');
            e.currentTarget.style.borderColor = '#e50914';
            e.currentTarget.style.color = '#e50914';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#999';
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px' }}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 500 }}>Add Profile</span>
        </button>
      </div>

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
          onClick={() => { setShowAddProfile(false); setNewProfileName(''); }}
        >
          <div
            data-nav-container="add-profile-modal"
            data-nav-row="add-profile"
            style={{
              background: '#141414',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '40px',
              minWidth: '450px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px', color: '#e50914' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <h2 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>Add Profile</h2>
            <p style={{ color: '#999', marginBottom: '32px', fontSize: '16px' }}>Enter a name for the new profile</p>
            <input
              ref={newProfileInputRef}
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newProfileName.trim()) {
                  addProfile(newProfileName.trim());
                  setShowAddProfile(false);
                  setNewProfileName('');
                } else if (e.key === 'Escape') {
                  setShowAddProfile(false);
                  setNewProfileName('');
                }
              }}
              placeholder="Profile name"
              maxLength={20}
              autoFocus
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '18px',
                textAlign: 'center',
                background: '#333',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                outline: 'none',
                marginBottom: '24px',
              }}
            />
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                data-focusable
                data-nav-row="add-profile"
                data-action="cancel-add"
                onClick={() => { setShowAddProfile(false); setNewProfileName(''); }}
                style={{
                  padding: '14px 32px',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                Cancel
              </button>
              <button
                data-focusable
                data-nav-row="add-profile"
                data-action="confirm-add-profile"
                disabled={!newProfileName.trim()}
                onClick={() => { if (newProfileName.trim()) { addProfile(newProfileName.trim()); setShowAddProfile(false); setNewProfileName(''); } }}
                style={{
                  padding: '14px 32px',
                  borderRadius: '4px',
                  background: newProfileName.trim() ? '#e50914' : '#333',
                  border: 'none',
                  color: newProfileName.trim() ? '#fff' : '#666',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: newProfileName.trim() ? 'pointer' : 'not-allowed',
                  minWidth: '120px',
                  opacity: newProfileName.trim() ? 1 : 0.6,
                }}
                onMouseEnter={(e) => focusElement(e.currentTarget as any, 'mouse')}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Profiles Link */}
      {!showAddProfile && !editingProfileId && profiles.length > 0 && (
        <button
          data-focusable
          data-nav-row="profiles"
          onClick={() => navigate('/profiles')}
          style={{
            marginTop: '32px',
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#999',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            focusElement(e.currentTarget as any, 'mouse');
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#999';
          }}
        >
          Manage Profiles
        </button>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}