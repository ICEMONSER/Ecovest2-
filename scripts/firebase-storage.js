// Firebase Storage Service for Media Files

if (typeof firebaseServices === 'undefined') {
  var firebaseServices = (typeof window !== 'undefined' && window.firebaseServices)
    ? window.firebaseServices
    : {
        app: null,
        auth: null,
        database: null,
        storage: null,
        isInitialized: () => false
      };
  if (typeof window !== 'undefined') {
    window.firebaseServices = firebaseServices;
  }
}

const firebaseStorage = {
  // Upload image
  uploadImage: async (file) => {
    const services = typeof firebaseServices !== 'undefined' ? firebaseServices : null;
    if (!services || typeof services.isInitialized !== 'function' || !services.isInitialized()) {
      throw new Error('Firebase not initialized');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image.');
    }

    const user = firebaseAuth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `images/${user.uid}/${timestamp}_${randomId}.${fileExtension}`;

      // Upload to Firebase Storage
      const storageRef = services.storage.ref(fileName);
      const uploadTask = storageRef.put(file);

      // Wait for upload to complete
      const snapshot = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking (optional)
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress}%`);
          },
          (error) => reject(error),
          () => resolve(uploadTask.snapshot)
        );
      });

      // Get download URL
      const downloadURL = await snapshot.ref.getDownloadURL();

      return {
        id: fileName,
        url: downloadURL,
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image: ' + (error.message || 'Unknown error'));
    }
  },

  // Upload video
  uploadVideo: async (file) => {
    const services = typeof firebaseServices !== 'undefined' ? firebaseServices : null;
    if (!services || typeof services.isInitialized !== 'function' || !services.isInitialized()) {
      throw new Error('Firebase not initialized');
    }

    if (!file.type.startsWith('video/')) {
      throw new Error('Invalid file type. Please upload a video.');
    }

    const user = firebaseAuth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `videos/${user.uid}/${timestamp}_${randomId}.${fileExtension}`;

      // Upload to Firebase Storage with resumable upload
      const storageRef = services.storage.ref(fileName);
      const uploadTask = storageRef.put(file);

      // Wait for upload to complete
      const snapshot = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress tracking
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Video upload progress: ${progress}%`);
          },
          (error) => {
            console.error('Video upload error:', error);
            reject(error);
          },
          () => resolve(uploadTask.snapshot)
        );
      });

      // Get download URL
      const downloadURL = await snapshot.ref.getDownloadURL();

      return {
        id: fileName,
        url: downloadURL,
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Video upload error:', error);
      throw new Error('Failed to upload video: ' + (error.message || 'Unknown error'));
    }
  },

  // Delete media file
  delete: async (filePath) => {
    const services = typeof firebaseServices !== 'undefined' ? firebaseServices : null;
    if (!services || typeof services.isInitialized !== 'function' || !services.isInitialized()) {
      throw new Error('Firebase not initialized');
    }

    try {
      const storageRef = services.storage.ref(filePath);
      await storageRef.delete();
      return true;
    } catch (error) {
      console.error('Delete media error:', error);
      throw new Error('Failed to delete media: ' + (error.message || 'Unknown error'));
    }
  }
};

