// Firebase Realtime Database Service

const firebaseDB = {
  // Posts
  posts: {
    // Get all posts with real-time listener
    getAll: (callback) => {
      if (!firebaseServices.isInitialized()) {
        callback([]);
        return () => {}; // Return no-op unsubscribe
      }

      const ref = firebaseServices.database.ref('posts');
      const listener = ref.on('value', (snapshot) => {
        const posts = [];
        snapshot.forEach((child) => {
          posts.push({ id: child.key, ...child.val() });
        });
        callback(posts);
      });

      return () => ref.off('value', listener);
    },

    // Get single post
    get: async (postId) => {
      if (!firebaseServices.isInitialized()) return null;
      const snapshot = await firebaseServices.database.ref(`posts/${postId}`).once('value');
      if (!snapshot.exists()) return null;
      return { id: snapshot.key, ...snapshot.val() };
    },

    // Add post
    add: async (post) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const postData = {
        ...post,
        uid: user.uid,
        username: user.username,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const ref = firebaseServices.database.ref('posts').push();
      await ref.set(postData);
      return { id: ref.key, ...postData };
    },

    // Update post
    update: async (postId, updates) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check ownership
      const post = await firebaseDB.posts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      if (post.uid !== user.uid) {
        throw new Error('Not authorized to edit this post');
      }

      await firebaseServices.database.ref(`posts/${postId}`).update({
        ...updates,
        updatedAt: Date.now()
      });

      return await firebaseDB.posts.get(postId);
    },

    // Delete post
    remove: async (postId) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check ownership
      const post = await firebaseDB.posts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }
      if (post.uid !== user.uid) {
        throw new Error('Not authorized to delete this post');
      }

      // Delete post
      await firebaseServices.database.ref(`posts/${postId}`).remove();

      // Delete associated comments
      const commentsSnapshot = await firebaseServices.database.ref('comments')
        .orderByChild('postId').equalTo(postId).once('value');
      const comments = commentsSnapshot.val() || {};
      const deletePromises = Object.keys(comments).map(commentId =>
        firebaseServices.database.ref(`comments/${commentId}`).remove()
      );
      await Promise.all(deletePromises);

      return true;
    },

    // Like post
    like: async (postId) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const postRef = firebaseServices.database.ref(`posts/${postId}`);
      const likeRef = firebaseServices.database.ref(`posts/${postId}/likes/${user.uid}`);

      // Check if already liked
      const likeSnapshot = await likeRef.once('value');
      if (likeSnapshot.exists()) {
        // Unlike
        await likeRef.remove();
        await postRef.transaction((post) => {
          if (post) {
            post.likes = (post.likes || 1) - 1;
          }
          return post;
        });
      } else {
        // Like
        await likeRef.set(true);
        await postRef.transaction((post) => {
          if (post) {
            post.likes = (post.likes || 0) + 1;
          }
          return post;
        });
      }

      return await firebaseDB.posts.get(postId);
    }
  },

  // Comments
  comments: {
    // Get comments for a post
    getByPost: (postId, callback) => {
      if (!firebaseServices.isInitialized()) {
        callback([]);
        return () => {};
      }

      const ref = firebaseServices.database.ref('comments')
        .orderByChild('postId').equalTo(postId);
      
      const listener = ref.on('value', (snapshot) => {
        const comments = [];
        snapshot.forEach((child) => {
          comments.push({ id: child.key, ...child.val() });
        });
        // Sort by createdAt
        comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        callback(comments);
      });

      return () => ref.off('value', listener);
    },

    // Add comment
    add: async (comment) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const commentData = {
        ...comment,
        uid: user.uid,
        username: user.username,
        createdAt: Date.now()
      };

      const ref = firebaseServices.database.ref('comments').push();
      await ref.set(commentData);

      // Update post comment count
      const postRef = firebaseServices.database.ref(`posts/${comment.postId}`);
      await postRef.transaction((post) => {
        if (post) {
          post.comments = (post.comments || 0) + 1;
        }
        return post;
      });

      // Award profile score if guided and Pro
      if (comment.guided && user.uid) {
        const profileSnapshot = await firebaseServices.database.ref(`profiles/${user.uid}`).once('value');
        const profile = profileSnapshot.val() || {};
        const score = profile.profileScore || 0;
        let level = 'Novice';
        if (score >= CONFIG.LEVELS.PRO.min) level = 'Pro';
        else if (score >= CONFIG.LEVELS.INTERMEDIATE.min) level = 'Intermediate';
        else if (score >= CONFIG.LEVELS.BEGINNER.min) level = 'Beginner';
        
        if (level === 'Pro') {
          const newScore = score + 1;
          await firebaseServices.database.ref(`profiles/${user.uid}`).update({ profileScore: newScore });
        }
      }

      return { id: ref.key, ...commentData };
    },

    remove: async (commentId) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const commentRef = firebaseServices.database.ref(`comments/${commentId}`);
      const snapshot = await commentRef.once('value');
      if (!snapshot.exists()) {
        throw new Error('Comment not found');
      }

      const comment = snapshot.val();
      const ownsByUid = comment.uid && user.uid ? comment.uid === user.uid : false;
      const ownsByUsername = comment.username ? comment.username === user.username : false;

      if (!ownsByUid && !ownsByUsername) {
        throw new Error('Not authorized to delete this comment');
      }

      await commentRef.remove();

      if (comment.postId) {
        const postRef = firebaseServices.database.ref(`posts/${comment.postId}`);
        await postRef.transaction((post) => {
          if (post) {
            post.comments = Math.max(0, (post.comments || 1) - 1);
          }
          return post;
        });
      }

      return true;
    }
  },

  // Profiles
  profiles: {
    // Get profile by UID
    get: async (uid) => {
      if (!firebaseServices.isInitialized()) return null;
      const snapshot = await firebaseServices.database.ref(`profiles/${uid}`).once('value');
      if (!snapshot.exists()) return null;
      return snapshot.val();
    },

    // Get profile by username
    getByUsername: async (username) => {
      if (!firebaseServices.isInitialized()) return null;
      const usernameLower = username.toLowerCase();
      const uidSnapshot = await firebaseServices.database.ref(`usernames/${usernameLower}`).once('value');
      if (!uidSnapshot.exists()) return null;
      const uid = uidSnapshot.val();
      return await firebaseDB.profiles.get(uid);
    },

    // Update profile
    update: async (uid, updates) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      await firebaseServices.database.ref(`profiles/${uid}`).update({
        ...updates,
        updatedAt: Date.now()
      });

      return await firebaseDB.profiles.get(uid);
    }
  },

  // Follows
  follows: {
    // Get following list
    getFollowing: async (uid) => {
      if (!firebaseServices.isInitialized()) return [];
      const snapshot = await firebaseServices.database.ref(`follows/${uid}/following`).once('value');
      const following = snapshot.val() || {};
      return Object.keys(following).filter(uid => following[uid] === true);
    },

    // Get followers list
    getFollowers: async (uid) => {
      if (!firebaseServices.isInitialized()) return [];
      const snapshot = await firebaseServices.database.ref(`follows/${uid}/followers`).once('value');
      const followers = snapshot.val() || {};
      return Object.keys(followers).filter(uid => followers[uid] === true);
    },

    // Follow user
    follow: async (followerUid, followeeUid) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      if (followerUid === followeeUid) return false;

      // Add to following list
      await firebaseServices.database.ref(`follows/${followerUid}/following/${followeeUid}`).set(true);
      // Add to followers list
      await firebaseServices.database.ref(`follows/${followeeUid}/followers/${followerUid}`).set(true);

      // Update counts
      const followerProfile = await firebaseDB.profiles.get(followerUid);
      const followeeProfile = await firebaseDB.profiles.get(followeeUid);
      
      await firebaseServices.database.ref(`profiles/${followerUid}`).update({
        following: (followerProfile?.following || 0) + 1
      });
      await firebaseServices.database.ref(`profiles/${followeeUid}`).update({
        followers: (followeeProfile?.followers || 0) + 1
      });

      return true;
    },

    // Unfollow user
    unfollow: async (followerUid, followeeUid) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      // Remove from following list
      await firebaseServices.database.ref(`follows/${followerUid}/following/${followeeUid}`).remove();
      // Remove from followers list
      await firebaseServices.database.ref(`follows/${followeeUid}/followers/${followerUid}`).remove();

      // Update counts
      const followerProfile = await firebaseDB.profiles.get(followerUid);
      const followeeProfile = await firebaseDB.profiles.get(followeeUid);
      
      await firebaseServices.database.ref(`profiles/${followerUid}`).update({
        following: Math.max(0, (followerProfile?.following || 1) - 1)
      });
      await firebaseServices.database.ref(`profiles/${followeeUid}`).update({
        followers: Math.max(0, (followeeProfile?.followers || 1) - 1)
      });

      return true;
    },

    // Check if following
    isFollowing: async (followerUid, followeeUid) => {
      if (!firebaseServices.isInitialized()) return false;
      const snapshot = await firebaseServices.database.ref(`follows/${followerUid}/following/${followeeUid}`).once('value');
      return snapshot.exists();
    }
  },

  // Game History
  gameHistory: {
    // Get game history for user
    getByUser: async (uid) => {
      if (!firebaseServices.isInitialized()) return [];
      const snapshot = await firebaseServices.database.ref('gameHistory')
        .orderByChild('uid').equalTo(uid).once('value');
      const history = [];
      snapshot.forEach((child) => {
        history.push({ id: child.key, ...child.val() });
      });
      return history.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    },

    // Add game history
    add: async (gameData) => {
      if (!firebaseServices.isInitialized()) {
        throw new Error('Firebase not initialized');
      }

      const user = firebaseAuth.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const historyData = {
        ...gameData,
        uid: user.uid,
        completedAt: Date.now()
      };

      const ref = firebaseServices.database.ref('gameHistory').push();
      await ref.set(historyData);
      return { id: ref.key, ...historyData };
    }
  }
};

