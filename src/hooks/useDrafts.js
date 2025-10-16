import { useState, useEffect } from 'react';
import { 
  getAllDrafts, 
  createDraft, 
  updateDraft, 
  deleteDraft 
} from '../services/draftService';

export const useDrafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all drafts
  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await getAllDrafts();
      setDrafts(data);
      setError(null);
    } catch (err) {
      console.error('Error loading drafts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a new draft
  const addDraft = async (draftData) => {
    try {
      setLoading(true);
      const newDraft = await createDraft({
        ...draftData,
        id: crypto.randomUUID(), // Generate a unique ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active'
      });
      setDrafts(prev => [newDraft, ...prev]);
      return newDraft;
    } catch (err) {
      console.error('Error adding draft:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing draft
  const editDraft = async (id, updates) => {
    try {
      setLoading(true);
      const updatedDraft = await updateDraft(id, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      setDrafts(prev => 
        prev.map(draft => draft.id === id ? updatedDraft : draft)
      );
      return updatedDraft;
    } catch (err) {
      console.error('Error updating draft:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove a draft
  const removeDraft = async (id) => {
    try {
      setLoading(true);
      await deleteDraft(id);
      setDrafts(prev => prev.filter(draft => draft.id !== id));
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, []);

  return {
    drafts,
    loading,
    error,
    addDraft,
    editDraft,
    removeDraft,
    refreshDrafts: loadDrafts
  };
};
