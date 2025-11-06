// Mock API functions

const api = {
  // Posts
  getPosts: async (sortBy = 'new') => {
    const posts = store.posts.getAll();
    const user = auth.getCurrentUser();
    
    // Prioritize followed users' posts
    let sorted = [...posts];
    if (user) {
      const following = store.follows.getFollowing(user.username);
      sorted = sorted.sort((a, b) => {
        const aIsFollowing = following.includes(a.username);
        const bIsFollowing = following.includes(b.username);
        if (aIsFollowing && !bIsFollowing) return -1;
        if (!aIsFollowing && bIsFollowing) return 1;
        return 0;
      });
    }
    
    // Then sort by selected method
    sorted = sorted.sort((a, b) => {
      // If one is followed and other isn't, keep that order
      if (user) {
        const following = store.follows.getFollowing(user.username);
        const aIsFollowing = following.includes(a.username);
        const bIsFollowing = following.includes(b.username);
        if (aIsFollowing && !bIsFollowing) return -1;
        if (!aIsFollowing && bIsFollowing) return 1;
      }
      
      switch (sortBy) {
        case 'hot':
          // Hot: combination of likes, comments, and recency
          const hotScoreA = (a.likes * 2 + a.comments * 3) / (1 + (Date.now() - a.createdAt) / 3600000);
          const hotScoreB = (b.likes * 2 + b.comments * 3) / (1 + (Date.now() - b.createdAt) / 3600000);
          return hotScoreB - hotScoreA;
        case 'top':
          // Top: most likes + comments
          const topScoreA = a.likes + a.comments;
          const topScoreB = b.likes + b.comments;
          return topScoreB - topScoreA;
        case 'new':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return sorted;
  },

  createPost: async (content, images = null, video = null, tags = []) => {
    const user = auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const post = {
      id: Date.now().toString(),
      username: user.username,
      content: sanitize(content),
      tags: tags.length > 0 ? tags : extractTags(content),
      image: images, // Can be array of URLs or single URL
      video,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    store.posts.add(post);
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return post;
  },

  likePost: async (postId) => {
    const post = store.posts.getAll().find(p => p.id === postId);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      store.posts.update(postId, { likes: post.likes });
    }
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return post;
  },

  // Comments
  getComments: async (postId) => {
    const comments = store.comments.getAll();
    const postComments = comments.filter(c => c.postId === postId);
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return postComments.sort((a, b) => a.createdAt - b.createdAt);
  },

  createComment: async (postId, content, guided = false) => {
    const user = auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const comment = {
      id: Date.now().toString(),
      postId,
      username: user.username,
      content: sanitize(content),
      guided,
      createdAt: Date.now()
    };

    store.comments.add(comment);
    
    // Update post comment count
    const post = store.posts.getAll().find(p => p.id === postId);
    if (post) {
      post.comments = (post.comments || 0) + 1;
      store.posts.update(postId, { comments: post.comments });
    }

    // If guided and user is Pro, award profile score
    if (guided && user.username) {
      const profile = store.profiles.get(user.username);
      const level = getLevel(profile.profileScore || 0);
      if (level === 'Pro') {
        const newScore = (profile.profileScore || 0) + 1;
        store.profiles.update(user.username, { profileScore: newScore });
      }
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return comment;
  },

  // Image upload (mock) - NO SIZE LIMITS - Uses IndexedDB
  uploadImage: async (file) => {
    // Validate file type only (MIME check)
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image.');
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    
    // Store in IndexedDB to bypass localStorage size limits
    const mediaId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await mediaDB.saveMedia(mediaId, file);
      return {
        id: mediaId,
        url: mediaId, // Use ID as reference
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('IndexedDB storage failed, using object URL:', error);
      // Fallback: return object URL (won't persist but works for current session)
      const objectURL = URL.createObjectURL(file);
      return {
        url: objectURL,
        filename: file.name,
        size: file.size,
        type: file.type,
        isObjectURL: true
      };
    }
  },

  // Video upload (mock) - NO SIZE LIMITS - Uses IndexedDB
  uploadVideo: async (file) => {
    // Validate file type only (MIME check)
    if (!file.type.startsWith('video/')) {
      throw new Error('Invalid file type. Please upload a video.');
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    
    // Store in IndexedDB to bypass localStorage size limits
    const mediaId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await mediaDB.saveMedia(mediaId, file);
      return {
        id: mediaId,
        url: mediaId, // Use ID as reference
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('IndexedDB storage failed:', error);
      // Fallback: return object URL (won't persist but works for current session)
      const objectURL = URL.createObjectURL(file);
      return {
        url: objectURL,
        filename: file.name,
        size: file.size,
        type: file.type,
        isObjectURL: true
      };
    }
  },

  // Update post
  updatePost: async (postId, updates) => {
    const user = auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const post = store.posts.getAll().find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Only allow owner or dev mode to edit
    const isDevMode = store.devMode.isActive();
    if (post.username !== user.username && !isDevMode) {
      throw new Error('Not authorized to edit this post');
    }

    const updated = {
      ...updates,
      updatedAt: Date.now()
    };

    if (updated.content) {
      updated.content = sanitize(updated.content);
      updated.tags = updated.tags || extractTags(updated.content);
    }

    store.posts.update(postId, updated);
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return store.posts.getAll().find(p => p.id === postId);
  },

  // Delete post
  deletePost: async (postId) => {
    const user = auth.getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const post = store.posts.getAll().find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Only allow owner or dev mode to delete
    const isDevMode = store.devMode.isActive();
    if (post.username !== user.username && !isDevMode) {
      throw new Error('Not authorized to delete this post');
    }

    // Delete associated comments
    const comments = store.comments.getAll();
    const postComments = comments.filter(c => c.postId === postId);
    const remainingComments = comments.filter(c => c.postId !== postId);
    store.comments.save(remainingComments);

    store.posts.remove(postId);
    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return true;
  },

  // Search posts
  searchPosts: async (query) => {
    const posts = store.posts.getAll();
    const lowerQuery = query.toLowerCase();
    
    const filtered = posts.filter(post => {
      const contentMatch = post.content.toLowerCase().includes(lowerQuery);
      const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const usernameMatch = post.username.toLowerCase().includes(lowerQuery);
      return contentMatch || tagMatch || usernameMatch;
    });

    await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY));
    return filtered;
  }
};

