// IndexedDB service for A+ Content Manager
import { v4 as uuidv4 } from 'uuid';

class ACMDatabase {
  constructor() {
    this.dbName = 'ACMContentDB';
    this.version = 2; // Incremented version to force upgrade
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        
        // Verify all required object stores exist
        const requiredStores = ['drafts', 'images'];
        const missingStores = requiredStores.filter(
          store => !Array.from(this.db.objectStoreNames).includes(store)
        );
        
        if (missingStores.length > 0) {
          console.warn('Missing object stores, forcing upgrade:', missingStores);
          this.version++;
          this.db.close();
          this.init().then(resolve).catch(reject);
          return;
        }
        
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'id' });
          console.log('Created drafts object store');
        }
        
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'id' });
          console.log('Created images object store');
        }
      };
      
      request.onblocked = (event) => {
        console.error('Database upgrade blocked:', event);
        reject(new Error('Database upgrade blocked. Please close other tabs with this app open.'));
      };
    });
  }

  async ensureDB() {
    try {
      if (!this.db) {
        await this.init();
      } else if (this.db.version !== this.version) {
        // If the database exists but version is outdated, close and reinitialize
        this.db.close();
        this.db = null;
        await this.init();
      }
      return this.db;
    } catch (error) {
      console.error('Error ensuring database:', error);
      // Try to recover by deleting and recreating the database
      if (error.name === 'VersionError' || error.name === 'InvalidStateError') {
        console.log('Attempting to recover from database error...');
        await this.deleteDatabase();
        return this.init();
      }
      throw error;
    }
  }

  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
      request.onerror = (event) => {
        console.error('Error deleting database:', event.target.error);
        reject(event.target.error);
      };
      request.onblocked = () => {
        const error = new Error('Database deletion blocked. Please close other tabs with this app open.');
        console.error(error);
        reject(error);
      };
    });
  }

  // Draft management
  async saveDraft(id, data) {
    const db = await this.ensureDB();
    // Ensure default status is 'active' if not set
    const draftData = { ...data, id, status: data.status || 'active' };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readwrite');
      tx.objectStore('drafts').put(draftData);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async updateDraftStatus(id, status) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readwrite');
      const store = tx.objectStore('drafts');
      const req = store.get(id);
      req.onsuccess = () => {
        const draft = req.result;
        if (draft) {
          draft.status = status;
          store.put(draft);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteDraft(id) {
    // Soft delete: move to trash instead of hard delete
    return this.updateDraftStatus(id, 'trash');
  }

  async getDraft(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readonly');
      const req = tx.objectStore('drafts').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllDrafts() {
    const db = await this.ensureDB();
    // Auto-trash old drafts before returning
    const trashedCount = await this.autoTrashOldDrafts();
    // Auto-delete trashed drafts older than 14 days
    const deletedCount = await this.autoDeleteOldTrashedDrafts();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readonly');
      const req = tx.objectStore('drafts').getAll();
      req.onsuccess = () => resolve({ drafts: req.result, trashedCount, deletedCount });
      req.onerror = () => reject(req.error);
    });
  }

  // Image management
  async saveImage(id, imageData) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images'], 'readwrite');
      tx.objectStore('images').put({ id, data: imageData });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getImage(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images'], 'readonly');
      const req = tx.objectStore('images').get(id);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteImage(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['images'], 'readwrite');
      tx.objectStore('images').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  generateId() {
    return uuidv4();
  }

  async hardDeleteDraft(id) {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readwrite');
      tx.objectStore('drafts').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async autoTrashOldDrafts() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readwrite');
      const store = tx.objectStore('drafts');
      const req = store.getAll();
      req.onsuccess = () => {
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const drafts = req.result;
        let trashedCount = 0;
        drafts.forEach(draft => {
          if ((draft.draftType === 'premium' || !draft.draftType || draft.draftType === 'basic') && draft.status !== 'trash' && draft.date) {
            const draftDate = new Date(draft.date).getTime();
            if (now - draftDate > weekMs) {
              draft.status = 'trash';
              store.put(draft);
              trashedCount++;
            }
          }
        });
        tx.oncomplete = () => resolve(trashedCount);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async autoDeleteOldTrashedDrafts() {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['drafts'], 'readwrite');
      const store = tx.objectStore('drafts');
      const req = store.getAll();
      req.onsuccess = () => {
        const now = Date.now();
        const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
        const drafts = req.result;
        let deletedCount = 0;
        drafts.forEach(draft => {
          if (draft.status === 'trash' && draft.date) {
            const draftDate = new Date(draft.date).getTime();
            if (now - draftDate > twoWeeksMs) {
              store.delete(draft.id);
              deletedCount++;
            }
          }
        });
        tx.oncomplete = () => resolve(deletedCount);
      };
      tx.onerror = () => reject(tx.error);
    });
  }
}

const acmDB = new ACMDatabase();
export default acmDB; 