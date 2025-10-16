import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import controlaLogo from '../images/controla-logo.png';
import { getDraftsFromSupabase, deleteDraftFromSupabase } from './supabaseDrafts';

function getErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return error.details;
  return JSON.stringify(error);
}

function BasicManageDraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('drafts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDrafts() {
      try {
        setLoading(true);
        setError(null);
        const drafts = await getDraftsFromSupabase('basic');
        setDrafts(drafts || []);
      } catch (error) {
        console.error('Error loading drafts:', error, error?.message, error?.stack, JSON.stringify(error));
        setError('Failed to load drafts. Using local storage as fallback.');
        setDrafts([]);
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, []);

  function handleLoadDraft(draft) {
    navigate(`/basic/edit/${draft.id}`);
  }
  
  async function handleDeleteDraft(id) {
    try {
      await deleteDraftFromSupabase(id);
      const drafts = await getDraftsFromSupabase('basic');
      setDrafts(drafts || []);
    } catch (error) {
      console.error('Error deleting draft:', error, error?.message, error?.stack, JSON.stringify(error));
      setError('Failed to delete draft. Please try again.');
      // Remove from local state even if server delete failed
      setDrafts(drafts => drafts.filter(d => d.id !== id));
    }
  }
  
  async function handleRestoreDraft(id) {
    try {
      // This function is no longer needed as status is managed by Supabase
      // await db.updateDraftStatus(id, 'active');
      const drafts = await getDraftsFromSupabase('basic');
      setDrafts(drafts || []);
    } catch (error) {
      console.error('Error restoring draft:', error, error?.message, error?.stack, JSON.stringify(error));
      setError('Failed to restore draft. Please try again.');
    }
  }
  
  async function handlePermanentDeleteDraft(id) {
    try {
      // This function is no longer needed as hardDelete is managed by Supabase
      // await db.hardDeleteDraft(id);
      const drafts = await getDraftsFromSupabase('basic');
      setDrafts(drafts || []);
    } catch (error) {
      console.error('Error permanently deleting draft:', error, error?.message, error?.stack, JSON.stringify(error));
      setError('Failed to permanently delete draft. Please try again.');
    }
  }
  
  // Only show drafts with status 'active' or 'trash' based on tab, and only basic drafts
  const filteredDrafts = drafts.filter(d =>
    (!d.draftType || d.draftType === 'basic') &&
    (d.name || d.contentName || 'Untitled').toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'all' || filter === d.status) &&
    ((tab === 'drafts' && (d.status === undefined || d.status === 'active')) || (tab === 'trash' && d.status === 'trash'))
  );

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Nav */}
      <nav style={{ background: 'transparent', height: 56, display: 'flex', alignItems: 'center', padding: '0 40px', color: '#23272f', fontWeight: 600, fontSize: 18 }}>
        <img src={controlaLogo} alt="Logo" style={{ height: 32, marginRight: 18 }} />
        <div style={{ flex: 1 }} />
        <button style={{ background: 'none', border: 'none', color: '#23272f', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>Home</button>
      </nav>
      
      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 24px',
          margin: '16px 40px',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Page Title and Tabs */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 0 0 0' }}>
        <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#23272f', marginBottom: 8 }}>Basic Drafts</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <span style={{ color: tab === 'drafts' ? '#2563eb' : '#64748b', fontWeight: tab === 'drafts' ? 600 : 500, borderBottom: tab === 'drafts' ? '2.5px solid #2563eb' : 'none', paddingBottom: 4, cursor: 'pointer' }} onClick={() => setTab('drafts')}>Drafts</span>
            <span style={{ color: tab === 'trash' ? '#2563eb' : '#64748b', fontWeight: tab === 'trash' ? 600 : 500, borderBottom: tab === 'trash' ? '2.5px solid #2563eb' : 'none', paddingBottom: 4, cursor: 'pointer' }} onClick={() => setTab('trash')}>Trash</span>
          </div>
          <div style={{ flex: 1 }} />
          <button style={{ background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }} onClick={() => navigate(-1)}>Back</button>
          <input
            type="text"
            placeholder="Search drafts"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#23272f', minWidth: 220, marginLeft: 0 }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid #e5e7eb', fontSize: 16, background: '#fff', color: '#23272f' }}>
            <option value="all">All</option>
            {/* Add more filter options if needed */}
          </select>
        </div>
        {/* Table Header */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '14px 32px', fontWeight: 600, color: '#64748b', fontSize: 15, marginBottom: 0 }}>
          <div style={{ flex: 3 }}>Name</div>
          <div style={{ flex: 2 }}>Modules</div>
          <div style={{ flex: 2 }}>Date</div>
          <div style={{ flex: 2, textAlign: 'right' }}>Actions</div>
        </div>
        {/* Drafts List */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(30,41,59,0.06)', marginTop: 0, minHeight: 120 }}>
          {loading ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontSize: 17 }}>
              Loading drafts...
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontSize: 17 }}>
              No drafts found.
            </div>
          ) : (
            filteredDrafts.map(draft => {
              // Map module type/id to title
              const moduleTitleMap = {
                'header': 'Standard Image Header With Text',
                'four-images-text': 'Standard Four Images & Text',
              };
              const moduleTitles = (draft.modules || []).map(m => {
                const type = m.type || m.moduleType || m.id;
                return moduleTitleMap[type] || (typeof type === 'string' && type.length < 40 ? type : 'Unknown Module');
              }).join(', ');
              return (
              <div key={draft.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '18px 32px' }}>
                <div style={{ flex: 3, fontWeight: 600, color: '#23272f' }}>{draft.name || draft.contentName || 'Untitled Draft'}</div>
                  <div style={{ flex: 2, color: '#23272f', fontSize: 15 }}>{moduleTitles}</div>
                <div style={{ flex: 2, color: '#64748b', fontSize: 15 }}>{draft.date ? new Date(draft.date).toLocaleString() : ''}</div>
                <div style={{ flex: 2, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  {tab === 'drafts' ? (
                    <>
                      <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleLoadDraft(draft)}>Load</button>
                      <button style={{ background: '#fff', color: '#b12704', border: '1.5px solid #b12704', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleDeleteDraft(draft.id)}>Delete</button>
                    </>
                  ) : (
                    <>
                      <button style={{ background: '#fff', color: '#2563eb', border: '1.5px solid #2563eb', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleRestoreDraft(draft.id)}>Restore</button>
                      <button style={{ background: '#fff', color: '#b12704', border: '1.5px solid #b12704', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handlePermanentDeleteDraft(draft.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default BasicManageDraftsPage; 