import React, { useState } from 'react';
import { useDrafts } from '../hooks/useDrafts';

const DraftsList = () => {
  const { drafts, loading, error, addDraft, removeDraft } = useDrafts();
  const [newDraftName, setNewDraftName] = useState('');

  const handleAddDraft = async (e) => {
    e.preventDefault();
    if (!newDraftName.trim()) return;
    
    try {
      await addDraft({
        contentName: newDraftName,
        name: newDraftName,
        modules: [],
        drafttype: 'basic',
        status: 'active'
      });
      setNewDraftName('');
    } catch (err) {
      console.error('Failed to add draft:', err);
    }
  };

  if (loading && drafts.length === 0) {
    return <div>Loading drafts...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="drafts-container">
      <h2>Drafts</h2>
      
      {/* Add New Draft Form */}
      <form onSubmit={handleAddDraft} className="add-draft-form">
        <input
          type="text"
          value={newDraftName}
          onChange={(e) => setNewDraftName(e.target.value)}
          placeholder="New draft name"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Draft'}
        </button>
      </form>

      {/* Drafts List */}
      <div className="drafts-list">
        {drafts.map((draft) => (
          <div key={draft.id} className="draft-item">
            <div>
              <h3>{draft.contentName || 'Untitled Draft'}</h3>
              <p>Type: {draft.drafttype}</p>
              <p>Status: {draft.status}</p>
              <p>Last updated: {new Date(draft.updated_at).toLocaleString()}</p>
            </div>
            <div className="draft-actions">
              <button 
                onClick={() => console.log('Edit:', draft.id)}
                disabled={loading}
              >
                Edit
              </button>
              <button 
                onClick={() => removeDraft(draft.id)}
                disabled={loading}
                className="delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {drafts.length === 0 && (
          <p>No drafts found. Create your first draft above.</p>
        )}
      </div>

      <style jsx>{`
        .drafts-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .add-draft-form {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }
        .add-draft-form input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .add-draft-form button {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .add-draft-form button:disabled {
          background-color: #cccccc;
        }
        .drafts-list {
          display: grid;
          gap: 15px;
        }
        .draft-item {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .draft-item h3 {
          margin: 0 0 5px 0;
        }
        .draft-item p {
          margin: 2px 0;
          color: #666;
          font-size: 0.9em;
        }
        .draft-actions {
          display: flex;
          gap: 10px;
        }
        .draft-actions button {
          padding: 5px 10px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        .draft-actions button.delete {
          color: #ff4444;
          border-color: #ffbbbb;
        }
        .error {
          color: #ff4444;
          padding: 10px;
          background: #ffebee;
          border-radius: 4px;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default DraftsList;
