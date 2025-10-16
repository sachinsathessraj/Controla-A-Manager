import React from 'react';

function ManageDraftsModal({ drafts, onLoad, onDelete, onClose }) {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto', padding: '32px 0 0 0' }}>
        <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#23272f', marginBottom: 8, textAlign: 'left', marginLeft: 8 }}>Drafts</div>
        {/* Table Header */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 8, padding: '14px 32px', fontWeight: 600, color: '#64748b', fontSize: 15, marginBottom: 0 }}>
          <div style={{ flex: 3 }}>Name</div>
          <div style={{ flex: 2 }}>Date</div>
          <div style={{ flex: 2, textAlign: 'right' }}>Actions</div>
        </div>
        {/* Drafts List */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(30,41,59,0.06)', marginTop: 0, minHeight: 120 }}>
          {drafts.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '48px 0', fontSize: 17 }}>No drafts found.</div>
          ) : (
            drafts.map(draft => (
              <div key={draft.id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb', padding: '18px 32px' }}>
                <div style={{ flex: 3, fontWeight: 600, color: '#23272f' }}>{draft.name || draft.contentName || 'Untitled Draft'}</div>
                <div style={{ flex: 2, color: '#64748b', fontSize: 15 }}>{draft.date ? new Date(draft.date).toLocaleString() : ''}</div>
                <div style={{ flex: 2, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => onLoad(draft.id)}>Load</button>
                  <button style={{ background: '#fff', color: '#b12704', border: '1.5px solid #b12704', borderRadius: 6, padding: '7px 18px', fontWeight: 600, cursor: 'pointer' }} onClick={() => onDelete(draft.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '9px 28px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem', transition: 'background 0.18s' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ManageDraftsModal; 