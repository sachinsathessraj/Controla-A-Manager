import { supabase } from '../supabaseClient';

// Storage bucket name
export const STORAGE_BUCKET = 'aplus-content';

export const CONTENT_TYPES = {
  BASIC: 'basic',
  PREMIUM: 'premium'
};

export const DRAFT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Default module structure for new drafts
export const DEFAULT_MODULES = {
  [CONTENT_TYPES.BASIC]: [
    {
      type: 'header',
      content: 'New Basic A+ Content',
      image: null
    }
  ],
  [CONTENT_TYPES.PREMIUM]: [
    {
      type: 'premium_header',
      title: 'New Premium Content',
      description: '',
      images: []
    }
  ]
};

// Validate draft data against schema
export const validateDraft = (draft) => {
  if (!draft) return false;
  return (
    draft.content_type_id &&
    (draft.content_type_id === CONTENT_TYPES.BASIC || draft.content_type_id === CONTENT_TYPES.PREMIUM) &&
    draft.name &&
    draft.status &&
    Object.values(DRAFT_STATUS).includes(draft.status)
  );
};

export default {
  STORAGE_BUCKET,
  CONTENT_TYPES,
  DRAFT_STATUS,
  DEFAULT_MODULES,
  validateDraft
};
