import { supabase } from '../supabaseClient';

// Check if Supabase connection is available
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('drafts').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.warn('Supabase connection check failed:', error);
    return false;
  }
}

// Save or update a draft in Supabase
export async function saveDraftToSupabase(draft) {
  try {
    console.log('[saveDraftToSupabase] Raw draft data:', draft);
    
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('Supabase connection check failed');
      throw new Error('Supabase not available. Draft not saved.');
    }

    const now = new Date().toISOString();

    // Map fields to match database schema with proper fallbacks
    const draftToSave = { 
      id: draft.id || crypto.randomUUID(),
      draft_type: draft.draftType || 'basic',
      content_name: draft.contentName || draft.name || 'Untitled Draft',
      modules: Array.isArray(draft.modules) ? draft.modules : [],
      created_at: draft.created_at || now,
      updated_at: now,
      // Only allow 'draft', 'published', or 'archived' as per database constraint
      status: ['draft', 'published', 'archived'].includes(draft.status) ? draft.status : 'draft',
      // Set to null for anonymous users since we're not using authentication
      user_id: draft.user_id || null,
      metadata: draft.metadata || {}
    };

    console.log('Processed draft data:', JSON.stringify(draftToSave, null, 2));

    // Upsert the draft
    const { data, error } = await supabase
      .from('drafts')
      .upsert(draftToSave, { onConflict: 'id' })
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        error: error
      });
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message && error.message.includes('row-level security policy')) {
        throw new Error('Database permission error. Please check your Supabase RLS policies.');
      }
      throw error;
    }
    
    console.log('Draft saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving draft to Supabase:', error);
    throw error;
  }
}

// Fetch all drafts, optionally filtered by type (e.g., 'basic' or 'premium')
export async function getDraftsFromSupabase(type) {
  try {
    console.log(`[getDraftsFromSupabase] Fetching drafts${type ? ` of type: ${type}` : ''}`);
    
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.warn('Supabase not available. Cannot load drafts from Supabase.');
      return [];
    }

    let query = supabase
      .from('drafts')
      .select('*')
      .order('updated_at', { ascending: false });

    // Filter by draft_type if provided
    if (type) {
      query = query.eq('draft_type', type);
    }
    
    // Execute the query and get the results
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching drafts from Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message && error.message.includes('row-level security policy')) {
        console.warn('RLS policy issue. Ensure proper RLS policies are set in Supabase.');
      }
      
      // Return empty array on error to prevent app crash
      return [];
    }
    
    console.log(`[getDraftsFromSupabase] Retrieved ${data?.length || 0} drafts`);
    
    // Map database snake_case to JavaScript camelCase for frontend
    return (data || []).map(draft => {
      const formattedDraft = {
        ...draft,
        // Add camelCase versions
        draftType: draft.draft_type,
        contentName: draft.content_name,
        // Map fields to match the expected format and ensure valid status
        id: draft.id,
        modules: Array.isArray(draft.modules) ? draft.modules : [],
        // Ensure status is one of the allowed values
        status: ['draft', 'published', 'archived'].includes(draft.status) ? draft.status : 'draft',
        metadata: draft.metadata || {},
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
        // Keep original fields for backward compatibility
        draftType: draft.draft_type,
        contentName: draft.content_name,
        contentType: draft.content_type
      };
      
      // Remove the snake_case fields to avoid confusion
      delete formattedDraft.draft_type;
      delete formattedDraft.content_name;
      delete formattedDraft.created_at;
      delete formattedDraft.updated_at;
      
      return formattedDraft;
    });
  } catch (error) {
    console.error('Error in getDraftsFromSupabase:', error);
    throw error;
  }
}

// Delete a draft by id
export async function deleteDraftFromSupabase(id) {
  try {
    if (!id) {
      throw new Error('Draft ID is required for deletion');
    }
    
    console.log(`[deleteDraftFromSupabase] Deleting draft with ID: ${id}`);
    
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      throw new Error('Supabase not available. Cannot delete draft.');
    }

    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting draft:', {
        id,
        message: error.message,
        code: error.code
      });
      throw error;
    }
    
    console.log(`[deleteDraftFromSupabase] Successfully deleted draft: ${id}`);
    return true;
  } catch (error) {
    console.error('Error in deleteDraftFromSupabase:', error);
    throw error;
  }
} 