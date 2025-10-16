import { saveDraftToSupabase } from './supabaseDrafts';
import { uploadImageToSupabase } from './supabaseStorage';

// Function to clean up all local storage data and migrate to Supabase
export async function cleanupLocalStorage() {
  console.log('🧹 Starting local storage cleanup and migration...');

  // Migrate and clear localStorage
  try {
    const keys = Object.keys(localStorage);
    const imageKeys = keys.filter(key => key.startsWith('local_'));
    for (const key of imageKeys) {
      try {
        const imageData = localStorage.getItem(key);
        if (imageData && imageData.startsWith('data:')) {
          // Convert base64 to blob
          const response = await fetch(imageData);
          const blob = await response.blob();
          const file = new File([blob], `${key}.png`, { type: 'image/png' });
          
          // Upload to Supabase
          const filePath = `migrated/${key}.png`;
          await uploadImageToSupabase(file, filePath);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to migrate image ${key}:`, error);
      }
      localStorage.removeItem(key);
    }
    console.log(`✅ Cleared ${imageKeys.length} items from localStorage`);
  } catch (error) {
    console.warn('⚠️ Failed to clear localStorage:', error);
  }

  // Migrate and clear IndexedDB
  try {
    const databases = await window.indexedDB.databases();
    for (const { name } of databases) {
      if (name === 'ACMContentDB' || name === 'ImageStorage') {
        // Open the database
        const db = await new Promise((resolve, reject) => {
          const request = window.indexedDB.open(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });

        // Migrate drafts from ACMContentDB
        if (name === 'ACMContentDB') {
          const transaction = db.transaction(['drafts'], 'readonly');
          const store = transaction.objectStore('drafts');
          const drafts = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });

          // Save each draft to Supabase
          for (const draft of drafts) {
            try {
              await saveDraftToSupabase(draft);
              console.log(`✅ Migrated draft: ${draft.id}`);
            } catch (error) {
              console.warn(`⚠️ Failed to migrate draft ${draft.id}:`, error);
            }
          }
        }

        // Migrate images from ImageStorage
        if (name === 'ImageStorage') {
          const transaction = db.transaction(['images'], 'readonly');
          const store = transaction.objectStore('images');
          const images = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
          });

          // Upload each image to Supabase
          for (const image of images) {
            try {
              if (image.data && image.data.startsWith('data:')) {
                // Convert base64 to blob
                const response = await fetch(image.data);
                const blob = await response.blob();
                const file = new File([blob], `${image.id}.png`, { type: 'image/png' });
                
                // Upload to Supabase
                const filePath = `migrated/${image.id}.png`;
                await uploadImageToSupabase(file, filePath);
                console.log(`✅ Migrated image: ${image.id}`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to migrate image ${image.id}:`, error);
            }
          }
        }

        // Delete the database
        db.close();
        const deleteRequest = window.indexedDB.deleteDatabase(name);
        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = () => {
            console.log(`✅ Successfully deleted IndexedDB database: ${name}`);
            resolve();
          };
          deleteRequest.onerror = () => {
            console.warn(`⚠️ Failed to delete IndexedDB database: ${name}`);
            reject(deleteRequest.error);
          };
        });
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to clear IndexedDB:', error);
  }

  console.log('✅ Local storage cleanup and migration completed');
} 