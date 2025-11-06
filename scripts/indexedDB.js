// IndexedDB for large file storage (videos)

const mediaDB = {
  dbName: 'EcoVestMedia',
  version: 1,
  db: null,

  // Initialize database
  init: async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(mediaDB.dbName, mediaDB.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        mediaDB.db = request.result;
        resolve(mediaDB.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store for media files
        if (!db.objectStoreNames.contains('media')) {
          const objectStore = db.createObjectStore('media', { keyPath: 'id' });
          objectStore.createIndex('postId', 'postId', { unique: false });
        }
      };
    });
  },

  // Store media file
  saveMedia: async (id, file, postId = null) => {
    if (!mediaDB.db) await mediaDB.init();

    return new Promise((resolve, reject) => {
      const transaction = mediaDB.db.transaction(['media'], 'readwrite');
      const objectStore = transaction.objectStore('media');
      
      const mediaData = {
        id,
        postId,
        file,
        type: file.type,
        name: file.name,
        size: file.size,
        createdAt: Date.now()
      };

      const request = objectStore.add(mediaData);

      request.onsuccess = () => {
        resolve({ id, url: id, type: file.type, filename: file.name, size: file.size });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // Get media file
  getMedia: async (id) => {
    if (!mediaDB.db) await mediaDB.init();

    return new Promise((resolve, reject) => {
      const transaction = mediaDB.db.transaction(['media'], 'readonly');
      const objectStore = transaction.objectStore('media');
      const request = objectStore.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const blob = request.result.file;
          const objectURL = URL.createObjectURL(blob);
          resolve({ 
            url: objectURL, 
            type: request.result.type,
            name: request.result.name 
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // Delete media
  deleteMedia: async (id) => {
    if (!mediaDB.db) await mediaDB.init();

    return new Promise((resolve, reject) => {
      const transaction = mediaDB.db.transaction(['media'], 'readwrite');
      const objectStore = transaction.objectStore('media');
      const request = objectStore.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
};

// Initialize on load
if (typeof indexedDB !== 'undefined') {
  mediaDB.init().catch(err => console.error('IndexedDB init failed:', err));
}

