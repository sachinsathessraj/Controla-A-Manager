import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import controlaLogo from '../images/controla-logo.png';
import { getDraftsFromSupabase, deleteDraftFromSupabase, saveDraftToSupabase } from '../database/supabaseDrafts';

// Content types constant
const CONTENT_TYPES = {
  BASIC: 'basic',
  // Add other content types if needed
};

// Initialize toast notifications
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusColors = {
    draft: 'bg-blue-100 text-blue-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };
  
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status || 'draft'}
    </span>
  );
};

function BasicManageDraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('drafts'); // 'drafts' or 'trash'
  const navigate = useNavigate();
  
  // Initialize acmDB mock for compatibility
  const acmDB = {
    drafts: {
      where: () => ({
        toArray: async () => [],
        delete: async () => {},
        update: async () => ({}),
        equals: () => ({
          toArray: async () => []
        })
      })
    },
    // Add other necessary mock methods
    transaction: async (mode, callback) => {
      return await callback({});
    }
  };

  // Get drafts from Supabase
  const getDrafts = async (contentType) => {
    try {
      const drafts = await getDraftsFromSupabase(contentType);
      return drafts || [];
    } catch (error) {
      console.error('Error getting drafts:', error);
      throw error;
    }
  };

  // Delete draft from Supabase
  const deleteDraft = async (id) => {
    try {
      await deleteDraftFromSupabase(id);
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  };

  // Update draft status in Supabase
  const updateDraftStatus = async (id, status) => {
    try {
      // First get the draft
      const drafts = await getDrafts(CONTENT_TYPES.BASIC);
      const draftToUpdate = drafts.find(d => d.id === id);
      
      if (!draftToUpdate) {
        throw new Error('Draft not found');
      }
      
      // Update the status and save
      await saveDraftToSupabase({
        ...draftToUpdate,
        status
      });
    } catch (error) {
      console.error('Error updating draft status:', error);
      throw error;
    }
  };

  // Mock handleProductChange and handleProductClear if needed
  const handleProductChange = (index, field, value) => {
    console.log(`Product ${index} ${field} changed to:`, value);
  };

  const handleProductClear = (index) => {
    console.log(`Clearing product at index ${index}`);
  };

  // Load drafts when component mounts
  useEffect(() => {
    async function loadDrafts() {
      try {
        setLoading(true);
        setError(null);
        const drafts = await getDrafts(CONTENT_TYPES.BASIC);
        setDrafts(drafts);
      } catch (error) {
        console.error('Error loading drafts:', error);
        setError('Failed to load drafts. Please try again later.');
        toast.error('Failed to load drafts');
      } finally {
        setLoading(false);
      }
    }
    
    loadDrafts();
  }, []);

  // Navigate to edit page
  const handleLoadDraft = (draft) => {
    navigate(`/basic/edit/${draft.id}`);
  };
  
  // Handle draft deletion
  const handleDeleteDraft = async (id, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDraft(id);
      setDrafts(drafts.filter(draft => draft.id !== id));
      toast.success('Draft deleted successfully');
    } catch (error) {
      console.error('Error deleting draft:', error);
      setError('Failed to delete draft. Please try again.');
      toast.error('Failed to delete draft');
    }
  };
  
  // Create new draft
  const handleCreateNew = () => {
    navigate('/basic/create');
  };
  
  // Handle search input
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (newTab) => {
    setTab(newTab);
  };
  
  // Filter drafts based on search, filter and tab
  const filteredDrafts = drafts.filter(draft => {
    const draftName = draft.name || draft.contentName || 'Untitled';
    const matchesSearch = draftName.toLowerCase().includes(search.toLowerCase());
    
    // Handle draft status (default to 'draft' if not set)
    const draftStatus = draft.status || 'draft';
    const matchesFilter = filter === 'all' || draftStatus === filter;
    
    // Show drafts in appropriate tabs
    const matchesTab = 
      (tab === 'drafts' && draftStatus !== 'archived') || 
      (tab === 'published' && draftStatus === 'published') ||
      (tab === 'archived' && draftStatus === 'archived');
    
    return matchesSearch && matchesFilter && matchesTab;
  });
  
  // Handle restoring a draft from trash
  const handleRestoreDraft = async (id) => {
    try {
      await updateDraftStatus(id, 'draft');
      const updatedDrafts = await getDrafts(CONTENT_TYPES.BASIC);
      setDrafts(updatedDrafts);
      toast.success('Draft restored successfully');
    } catch (error) {
      console.error('Error restoring draft:', error);
      setError('Failed to restore draft. Please try again.');
      toast.error('Failed to restore draft');
    }
  };
  
  // Handle permanent deletion
  const handlePermanentDeleteDraft = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this draft? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDraft(id);
      setDrafts(drafts.filter(d => d.id !== id));
      toast.success('Draft permanently deleted');
    } catch (error) {
      console.error('Error permanently deleting draft:', error);
      setError('Failed to permanently delete draft. Please try again.');
      toast.error('Failed to delete draft');
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Loading drafts...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Basic A+ Content Drafts</h1>
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Draft
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search drafts..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filter}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('drafts')}
                className={`${tab === 'drafts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
              >
                All Drafts
              </button>
              <button
                onClick={() => handleTabChange('published')}
                className={`${tab === 'published' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
              >
                Published
              </button>
              <button
                onClick={() => handleTabChange('archived')}
                className={`${tab === 'archived' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm`}
              >
                Archived
              </button>
            </nav>
          </div>

          {filteredDrafts.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {tab === 'drafts' 
                  ? 'Get started by creating a new draft.' 
                  : tab === 'published' 
                    ? 'No published drafts found.' 
                    : 'No archived drafts found.'}
              </p>
              {tab === 'drafts' && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Draft
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredDrafts.map((draft) => (
                <li key={draft.id}>
                  <div 
                    className="block hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLoadDraft(draft)}
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {draft.name || 'Untitled Draft'}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            draft.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : draft.status === 'archived' 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {draft.status || 'draft'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            Created {new Date(draft.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          {draft.updated_at && (
                            <>
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <p>Last updated {new Date(draft.updated_at).toLocaleString()}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {draft.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 line-clamp-2">{draft.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {tab === 'archived' && (
                    <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreDraft(draft.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDeleteDraft(draft.id);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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