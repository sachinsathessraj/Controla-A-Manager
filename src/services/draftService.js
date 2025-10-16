import { supabase } from '../supabaseClient';

// Create a new draft
export const createDraft = async ({
  content_name,
  draft_type = 'basic',
  modules = [],
  metadata = {},
  status = 'draft',
  user_id = 'anonymous'
}) => {
  const { data, error } = await supabase
    .from('drafts')
    .insert([{
      content_name,
      draft_type,
      modules: Array.isArray(modules) ? modules : [],
      metadata,
      status,
      user_id
    }])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
  return data;
};

// Get all drafts, optionally filtered by type
export const getDrafts = async (draftType = null) => {
  try {
    let query = supabase
      .from('drafts')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (draftType) {
      query = query.eq('draft_type', draftType);
    }
      
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching drafts:', error);
    throw error;
  }
};

// Get a single draft by ID
export const getDraftById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    // Basic validation
    if (!data || !data.content_name) {
      throw new Error('Invalid draft data received from server');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching draft ${id}:`, error);
    throw error;
  }
};

// Update an existing draft
export const updateDraft = async (id, updates) => {
  try {
    // Don't allow updating the ID
    const { id: _, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('drafts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating draft ${id}:`, error);
    throw error;
  }
};

// Delete a draft
export const deleteDraft = async (id) => {
  try {
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting draft ${id}:`, error);
    throw error;
  }
};

// Update draft status
export const updateDraftStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating status for draft ${id}:`, error);
    throw error;
  }
};
