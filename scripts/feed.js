// Feed page module

const feed = {
  currentSort: 'new',
  currentSearch: '',
  postsUnsubscribe: null, // For Firebase real-time listener cleanup

  // Initialize feed
  init: async () => {
    const session = store.session.load();
    if (!session) {
      window.location.href = './index.html';
      return;
    }

    // Check if user has completed the game (has a level)
    const profile = store.profiles.get(session.username);
    // Only redirect if user is still Novice AND has no score (hasn't played at all)
    if (profile.level === 'Novice' && (!profile.profileScore || profile.profileScore < 20)) {
      ui.toast('Please complete the trading game first to access the feed! 🎮', 'info', 4000);
      setTimeout(() => {
        window.location.href = './game.html';
      }, 1500);
      return;
    }

    // Clear legacy feed data on version bump
    if (store?.maintenance?.ensureFeedVersion) {
      store.maintenance.ensureFeedVersion();
    }

    // Initialize sample data if needed
    store.initSampleData();

    // Set up event listeners
    feed.setupEventListeners();

    // Load posts
    await feed.loadPosts();

    // Check if we should highlight a specific post (from URL params)
    feed.checkHighlightPost();
  },

  // Check and highlight post from URL parameter
  checkHighlightPost: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    
    if (highlightId) {
      // Wait for posts to render, then scroll to and highlight the post
      setTimeout(() => {
        const postElement = document.querySelector(`[data-post-id="${highlightId}"]`);
        if (postElement) {
          // Scroll to post
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add highlight animation
          postElement.classList.add('post-highlight');
          
          // Remove highlight after animation
          setTimeout(() => {
            postElement.classList.remove('post-highlight');
            // Clean URL
            window.history.replaceState({}, '', './feed.html');
          }, 3000);
        }
      }, 500);
    }
  },

  // Setup event listeners
  setupEventListeners: () => {
    // Sort tabs
    $$('.sort-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const sortBy = tab.dataset.sort;
        feed.currentSort = sortBy;
        feed.updateSortTabs();
        feed.loadPosts();
      });
    });

    // Search
    const searchInput = $('#searchInput');
    if (searchInput) {
      const debouncedSearch = debounce(() => {
        feed.currentSearch = searchInput.value.trim();
        feed.loadPosts();
      }, 300);
      searchInput.addEventListener('input', debouncedSearch);
    }

    // Create post modal
    $('#createPostBtn')?.addEventListener('click', () => {
      ui.openModal('createPostModal');
    });

    // Create post form
    $('#createPostForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await feed.handleCreatePost();
    });

    // Media upload (images and videos)
    $('#mediaUpload')?.addEventListener('change', (e) => {
      feed.handleMediaPreview(e.target.files);
    });

    // Close any open dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.post-dropdown')) {
        feed.closeAllDropdowns();
      }
    });
  },

  // Update sort tabs UI
  updateSortTabs: () => {
    $$('.sort-tab').forEach(tab => {
      if (tab.dataset.sort === feed.currentSort) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  },

  // Load posts - Uses Firebase real-time listeners if available
  loadPosts: async () => {
    const container = $('#postsContainer');
    if (!container) return;

    const authUser = auth.getCurrentUser();
    const useFirebase = typeof firebaseServices !== 'undefined' &&
      firebaseServices &&
      firebaseServices.isInitialized && firebaseServices.isInitialized() &&
      typeof firebaseDB !== 'undefined' && firebaseDB &&
      authUser && authUser.uid;
 
    // Use Firebase real-time listener if available
    if (useFirebase) {
      
      // Clean up previous listener
      if (feed.postsUnsubscribe) {
        feed.postsUnsubscribe();
        feed.postsUnsubscribe = null;
      }
      
      ui.showLoading(container);
      
      // Set up real-time listener
      feed.postsUnsubscribe = firebaseDB.posts.getAll((posts) => {
        // Filter by search if needed
        let filteredPosts = posts;
        if (feed.currentSearch) {
          const lowerQuery = feed.currentSearch.toLowerCase();
          filteredPosts = posts.filter(post => {
            const contentMatch = (post.content || '').toLowerCase().includes(lowerQuery);
            const tagMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery));
            const usernameMatch = (post.username || '').toLowerCase().includes(lowerQuery);
            return contentMatch || tagMatch || usernameMatch;
          });
        }
        
        // Sort posts
        if (authUser && authUser.uid) {
          firebaseDB.follows.getFollowing(authUser.uid).then(following => {
            let sorted = [...filteredPosts];
            sorted = sorted.sort((a, b) => {
              const aIsFollowing = following.includes(a.uid);
              const bIsFollowing = following.includes(b.uid);
              if (aIsFollowing && !bIsFollowing) return -1;
              if (!aIsFollowing && bIsFollowing) return 1;
              
              switch (feed.currentSort) {
                case 'hot':
                  const hotScoreA = ((a.likes || 0) * 2 + (a.comments || 0) * 3) / (1 + (Date.now() - (a.createdAt || 0)) / 3600000);
                  const hotScoreB = ((b.likes || 0) * 2 + (b.comments || 0) * 3) / (1 + (Date.now() - (b.createdAt || 0)) / 3600000);
                  return hotScoreB - hotScoreA;
                case 'top':
                  return ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0));
                case 'new':
                default:
                  return (b.createdAt || 0) - (a.createdAt || 0);
              }
            });
            feed.renderPosts(sorted);
          }).catch(() => {
            // If follows fetch fails, just sort without following priority
            let sorted = [...filteredPosts];
            sorted = sorted.sort((a, b) => {
              switch (feed.currentSort) {
                case 'hot':
                  const hotScoreA = ((a.likes || 0) * 2 + (a.comments || 0) * 3) / (1 + (Date.now() - (a.createdAt || 0)) / 3600000);
                  const hotScoreB = ((b.likes || 0) * 2 + (b.comments || 0) * 3) / (1 + (Date.now() - (b.createdAt || 0)) / 3600000);
                  return hotScoreB - hotScoreA;
                case 'top':
                  return ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0));
                case 'new':
                default:
                  return (b.createdAt || 0) - (a.createdAt || 0);
              }
            });
            feed.renderPosts(sorted);
          });
        } else {
          // No user, just sort
          let sorted = [...filteredPosts];
          sorted = sorted.sort((a, b) => {
            switch (feed.currentSort) {
              case 'hot':
                const hotScoreA = ((a.likes || 0) * 2 + (a.comments || 0) * 3) / (1 + (Date.now() - (a.createdAt || 0)) / 3600000);
                const hotScoreB = ((b.likes || 0) * 2 + (b.comments || 0) * 3) / (1 + (Date.now() - (b.createdAt || 0)) / 3600000);
                return hotScoreB - hotScoreA;
              case 'top':
                return ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0));
              case 'new':
              default:
                return (b.createdAt || 0) - (a.createdAt || 0);
            }
          });
          feed.renderPosts(sorted);
        }
      });
      
      return; // Real-time listener is set up
    }

    // Fallback to regular API call (localStorage)
    ui.showLoading(container);

    try {
      let posts;
      if (feed.currentSearch) {
        posts = await api.searchPosts(feed.currentSearch);
      } else {
        posts = await api.getPosts(feed.currentSort);
      }

      feed.renderPosts(posts);
    } catch (e) {
      ui.toast('Failed to load posts', 'error');
      container.innerHTML = '<p class="error-message">Failed to load posts. Please try again.</p>';
    }
  },

  // Render posts
  renderPosts: (posts) => {
    const container = $('#postsContainer');
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = '<p class="empty-state">No posts found. Be the first to post!</p>';
      return;
    }

    container.innerHTML = posts.map(post => feed.renderPost(post)).join('');

    // Attach event listeners to posts
    posts.forEach(post => {
      // Like button
      $(`#likeBtn-${post.id}`)?.addEventListener('click', () => feed.handleLike(post.id));
      
      // Comment button
      $(`#commentBtn-${post.id}`)?.addEventListener('click', () => feed.toggleComments(post.id));
      
      // Dropdown toggle
      $(`#dropdownToggle-${post.id}`)?.addEventListener('click', (e) => {
        e.stopPropagation();
        feed.toggleDropdown(post.id);
      });
      
      // Edit option
      $(`#editBtn-${post.id}`)?.addEventListener('click', () => {
        feed.closeAllDropdowns();
        feed.handleEditPost(post.id);
      });
      
      // Delete option
      $(`#deleteBtn-${post.id}`)?.addEventListener('click', () => {
        feed.closeAllDropdowns();
        feed.handleDeletePost(post.id);
      });
      
      // Follow button
      $(`#followBtn-${post.id}`)?.addEventListener('click', () => feed.handleFollow(post.username));
    });
  },

  // Render single post
  renderPost: (post) => {
    const session = store.session.load();
    const isOwnPost = session && post.username === session.username;
    
    const isFollowing = session && store.follows.isFollowing(session.username, post.username);
    
    const tags = post.tags.map(tag => `<span class="tag">${sanitize(tag)}</span>`).join('');
    
    // Handle images (single or array) - Grid layout for multiple images
    let imageSection = '';
    if (post.image) {
      if (Array.isArray(post.image)) {
        imageSection = `
          <div class="feed-images" id="images_${post.id}">
            ${post.image.map((img, index) => {
              const imgData = typeof img === 'string' ? { url: img } : img;
              const imgUrl = imgData.url || imgData.id || imgData;
              const imgId = `img_${post.id}_${index}`;
              return `<img id="${imgId}" src="${imgUrl}" alt="Post image" data-img-ref="${imgUrl}">`;
            }).join('')}
          </div>
        `;
        
        // Load images from IndexedDB if needed
        setTimeout(async () => {
          post.image.forEach(async (img, index) => {
            const imgData = typeof img === 'string' ? { url: img } : img;
            const imgUrl = imgData.url || imgData.id || imgData;
            
            // Check if this is an IndexedDB reference
            if (imgUrl && !imgUrl.startsWith('data:') && !imgUrl.startsWith('blob:') && !imgUrl.startsWith('http')) {
              try {
                const media = await mediaDB.getMedia(imgUrl);
                if (media) {
                  const imgElement = document.getElementById(`img_${post.id}_${index}`);
                  if (imgElement) {
                    imgElement.src = media.url;
                  }
                }
              } catch (e) {
                console.error('Failed to load image from IndexedDB:', e);
              }
            }
          });
        }, 50);
      } else if (typeof post.image === 'string') {
        imageSection = `<img src="${post.image}" alt="Post image" class="post-image">`;
      } else if (post.image.url) {
        imageSection = `<img src="${post.image.url}" alt="Post image" class="post-image">`;
      }
    }
    
    // Handle video - load from IndexedDB if needed
    let videoSection = '';
    if (post.video) {
      const videoData = typeof post.video === 'string' ? { url: post.video, type: 'video/mp4' } : post.video;
      const videoUrl = videoData.url || videoData.id || videoData;
      const videoType = videoData.type || 'video/mp4';
      
      // Create unique ID for video element
      const videoId = `video_${post.id}`;
      
      videoSection = `
        <video id="${videoId}" controls preload="metadata" class="feed-video post-video" data-video-ref="${videoUrl}">
          <source src="${videoUrl}" type="${videoType}">
          Your browser does not support the video tag.
        </video>
      `;
      
      // Load from IndexedDB if URL is an ID reference
      if (videoUrl && !videoUrl.startsWith('data:') && !videoUrl.startsWith('blob:') && !videoUrl.startsWith('http')) {
        // This is an IndexedDB reference, load it asynchronously
        setTimeout(async () => {
          try {
            const media = await mediaDB.getMedia(videoUrl);
            if (media) {
              const videoElement = document.getElementById(videoId);
              if (videoElement) {
                const source = videoElement.querySelector('source');
                if (source) {
                  source.src = media.url;
                  videoElement.load();
                }
              }
            }
          } catch (e) {
            console.error('Failed to load video from IndexedDB:', e);
          }
        }, 100);
      }
    }
    
    const profile = store.profiles.get(post.username);
    const level = getLevel(profile.profileScore || 0);
    
    const dropdownMenu = isOwnPost ? `
      <div class="post-dropdown">
        <button class="post-dropdown-toggle" id="dropdownToggle-${post.id}" aria-label="Post options">
          <span>⋯</span>
        </button>
        <div class="post-dropdown-menu" id="dropdownMenu-${post.id}">
          <button class="post-dropdown-item" id="editBtn-${post.id}"><span>✏️</span> Edit Post</button>
          <button class="post-dropdown-item" id="deleteBtn-${post.id}"><span>🗑</span> Delete Post</button>
        </div>
      </div>
    ` : '';
    
    const followButton = session && !isOwnPost ? `
      <button class="btn btn-sm ${isFollowing ? 'btn-outline' : 'btn-primary'}" id="followBtn-${post.id}">
        ${isFollowing ? '✓ Following' : '+ Follow'}
      </button>
    ` : '';

    return `
      <article class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-author">
            <a href="./profile.html?user=${encodeURIComponent(post.username)}">
              ${getAvatarPlaceholder(post.username)}
            </a>
            <div>
              <div class="author-name">
                <a href="./profile.html?user=${encodeURIComponent(post.username)}">${sanitize(post.username)}</a>
              </div>
              <span class="level-badge level-${level.toLowerCase()}">${level}</span>
            </div>
            ${followButton}
          </div>
          <div class="post-header-actions">
            ${dropdownMenu}
            <time class="post-time">${formatTime(post.createdAt)}</time>
          </div>
        </div>
        
        <div class="post-content">
          <p>${sanitize(post.content)}</p>
          ${imageSection}
          ${videoSection}
          <div class="post-tags">${tags}</div>
        </div>

        <div class="post-actions">
          <button class="action-btn" id="likeBtn-${post.id}" aria-label="Like">
            <span>👍</span> ${post.likes || 0}
          </button>
          <button class="action-btn" id="commentBtn-${post.id}" aria-label="Comment">
            <span>💬</span> ${post.comments || 0}
          </button>
        </div>

        <div class="comments-section" id="comments-${post.id}" style="display: none;">
          <div class="comments-list" id="commentsList-${post.id}"></div>
          <form class="comment-form" id="commentForm-${post.id}">
            <input type="text" placeholder="Write a comment..." required id="commentInput-${post.id}">
            <div class="comment-actions">
              <label class="checkbox-label">
                <input type="checkbox" id="guidedCheck-${post.id}">
                <span>Mark as Guided (Pro only)</span>
              </label>
              <button type="submit" class="btn btn-primary btn-sm">Post</button>
            </div>
          </form>
        </div>
      </article>
    `;
  },

  // Handle like
  handleLike: async (postId) => {
    try {
      await api.likePost(postId);
      await feed.loadPosts();
      ui.toast('Post liked!', 'success');
    } catch (e) {
      ui.toast('Failed to like post', 'error');
    }
  },

  // Toggle comments
  toggleComments: (postId) => {
    const section = $(`#comments-${postId}`);
    if (!section) return;

    const isVisible = section.style.display !== 'none';
    section.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      feed.loadComments(postId);
      feed.setupCommentForm(postId);
    }
  },

  // Load comments
  loadComments: async (postId) => {
    const container = $(`#commentsList-${postId}`);
    if (!container) return;

    try {
      const comments = await api.getComments(postId);
      
      if (comments.length === 0) {
        container.innerHTML = '<p class="empty-comments">No comments yet. Be the first to comment!</p>';
        return;
      }

      container.innerHTML = comments.map(comment => feed.renderComment(comment)).join('');
    } catch (e) {
      container.innerHTML = '<p class="error-message">Failed to load comments</p>';
    }
  },

  // Render comment
  renderComment: (comment) => {
    const profile = store.profiles.get(comment.username);
    const level = getLevel(profile.profileScore || 0);
    const guidedBadge = comment.guided ? '<span class="guided-badge">✓ Guided</span>' : '';

    return `
      <div class="comment-item">
        <div class="comment-author">
          ${getAvatarPlaceholder(comment.username)}
          <div>
            <div class="author-name">${sanitize(comment.username)}</div>
            <span class="level-badge level-${level.toLowerCase()}">${level}</span>
            ${guidedBadge}
          </div>
        </div>
        <p class="comment-content">${sanitize(comment.content)}</p>
        <time class="comment-time">${formatTime(comment.createdAt)}</time>
      </div>
    `;
  },

  // Setup comment form
  setupCommentForm: (postId) => {
    const form = $(`#commentForm-${postId}`);
    if (!form) return;

    // Remove existing listeners (if any)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $(`#commentInput-${postId}`);
      const guidedCheck = $(`#guidedCheck-${postId}`);
      
      if (!input || !input.value.trim()) return;

      const session = store.session.load();
      const profile = store.profiles.get(session.username);
      const level = getLevel(profile.profileScore || 0);
      const guided = guidedCheck?.checked && level === 'Pro';

      try {
        await api.createComment(postId, input.value.trim(), guided);
        input.value = '';
        if (guidedCheck) guidedCheck.checked = false;
        await feed.loadComments(postId);
        await feed.loadPosts(); // Refresh to update comment count
        ui.toast('Comment posted!', 'success');
      } catch (e) {
        ui.toast('Failed to post comment', 'error');
      }
    });
  },

  // Handle create post
  handleCreatePost: async () => {
    const form = $('#createPostForm');
    const contentInput = $('#postContent');
    const mediaInput = $('#mediaUpload');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!form || !contentInput || !contentInput.value.trim()) {
      ui.toast('Please enter post content', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      let images = [];
      let video = null;
      
      // Process uploaded files (stored in IndexedDB - no size limits!)
      if (mediaInput?.files && mediaInput.files.length > 0) {
        for (let file of mediaInput.files) {
          if (file.type.startsWith('image/')) {
            const imageData = await api.uploadImage(file);
            images.push(imageData); // Store complete object with ID
          } else if (file.type.startsWith('video/')) {
            if (!video) { // Only take first video
              const videoData = await api.uploadVideo(file);
              video = videoData; // Store complete video object (includes id, url, type)
            }
          }
        }
      }

      const content = contentInput.value.trim();
      const tags = extractTags(content);

      // Debug: Check what we're posting
      console.log('Creating post with:', { 
        images: images.length, 
        hasVideo: !!video,
        videoType: video?.type 
      });

      // Create post with images array and video (IndexedDB handles large videos)
      const newPost = await api.createPost(content, images.length > 0 ? images : null, video, tags);
      console.log('Post created successfully:', newPost); // Debug log
      
      ui.toast('Post created!', 'success');
      ui.closeModal('createPostModal');
      form.reset();
      $('#mediaPreview').innerHTML = '';
      
      await feed.loadPosts();
    } catch (e) {
      ui.toast(e.message || 'Failed to create post', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post';
    }
  },

  // Handle media preview (both images and videos)
  handleMediaPreview: (files) => {
    if (!files || files.length === 0) return;

    const preview = $('#mediaPreview');
    if (!preview) return;

    preview.innerHTML = ''; // Clear previous previews

    let imageCount = 0;
    let videoCount = 0;

    Array.from(files).forEach((file, index) => {
      // Validate file type only (NO SIZE LIMITS)
      if (file.type.startsWith('image/')) {
        imageCount++;
      } else if (file.type.startsWith('video/')) {
        if (videoCount > 0) {
          ui.toast('Only one video per post allowed', 'warning');
          return;
        }
        videoCount++;
      } else {
        ui.toast(`Unsupported file type: ${file.name}. Use images or videos only.`, 'error');
        return;
      }

      // Create preview using URL.createObjectURL (faster, no size limit)
      const previewItem = document.createElement('div');
      previewItem.className = 'media-preview-item';
      previewItem.dataset.index = index;

      if (file.type.startsWith('image/')) {
        const objectURL = URL.createObjectURL(file);
        previewItem.innerHTML = `
          <img src="${objectURL}" alt="Preview ${index + 1}">
          <button type="button" class="remove-media" data-index="${index}">×</button>
        `;
      } else if (file.type.startsWith('video/')) {
        const objectURL = URL.createObjectURL(file);
        previewItem.innerHTML = `
          <video controls preload="metadata">
            <source src="${objectURL}" type="${file.type}">
            Your browser does not support the video tag.
          </video>
          <button type="button" class="remove-media" data-index="${index}">×</button>
        `;
      }

      preview.appendChild(previewItem);

      // Add remove button handler
      previewItem.querySelector('.remove-media')?.addEventListener('click', (e) => {
        e.preventDefault();
        // Revoke object URL to free memory
        const img = previewItem.querySelector('img');
        const video = previewItem.querySelector('video source');
        if (img) URL.revokeObjectURL(img.src);
        if (video) URL.revokeObjectURL(video.src);
        
        previewItem.remove();
        // Clear input if no more previews
        if (preview.children.length === 0) {
          $('#mediaUpload').value = '';
        }
      });
    });
  },

  // Handle edit post
  handleEditPost: async (postId) => {
    const post = store.posts.getAll().find(p => p.id === postId);
    if (!post) return;

    const content = prompt('Edit post content:', post.content);
    if (content === null) return; // User cancelled

    if (!content.trim()) {
      ui.toast('Post content cannot be empty', 'error');
      return;
    }

    try {
      await api.updatePost(postId, { content: content.trim() });
      ui.toast('Post updated!', 'success');
      await feed.loadPosts();
    } catch (e) {
      ui.toast(e.message || 'Failed to update post', 'error');
    }
  },

  // Handle delete post
  handleDeletePost: async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await api.deletePost(postId);
      ui.toast('Post deleted!', 'success');
      await feed.loadPosts();
    } catch (e) {
      ui.toast(e.message || 'Failed to delete post', 'error');
    }
  },

  // Handle follow
  handleFollow: async (username) => {
    const session = store.session.load();
    if (!session) return;

    const isFollowing = store.follows.isFollowing(session.username, username);

    try {
      if (isFollowing) {
        store.follows.unfollow(session.username, username);
        ui.toast(`Unfollowed ${username}`, 'info');
      } else {
        store.follows.follow(session.username, username);
        ui.toast(`Following ${username}`, 'success');
      }
      
      await feed.loadPosts();
    } catch (e) {
      ui.toast('Failed to update follow status', 'error');
    }
  },

  // Toggle dropdown menu
  toggleDropdown: (postId) => {
    const menu = $(`#dropdownMenu-${postId}`);
    if (!menu) return;
    // Close other dropdowns
    feed.closeAllDropdowns(postId);
    menu.classList.toggle('active');
  },

  // Close all dropdowns
  closeAllDropdowns: (exceptPostId = null) => {
    $$('.post-dropdown-menu').forEach(menu => {
      if (exceptPostId) {
        const id = menu.id.replace('dropdownMenu-', '');
        if (id === exceptPostId) return;
      }
      menu.classList.remove('active');
    });
  }
};

