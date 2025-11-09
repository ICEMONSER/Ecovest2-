import express from "express";
import cors from "cors";
import fs from "fs";
import admin from "firebase-admin";

const PORT = process.env.PORT || 7000;

const app = express();
app.use(cors());
app.use(express.json());

let realtimeDb = null;

const memoryStore = {
  posts: [],
  comments: [],
};

const createId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const sanitizeString = (value, fallback = "") => {
  if (typeof value !== "string") return fallback;
  return value.trim();
};

const loadServiceAccount = () => {
  const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const pathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (jsonFromEnv) {
    try {
      return JSON.parse(jsonFromEnv);
    } catch (error) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON.", error);
    }
  }

  if (pathFromEnv) {
    try {
      const fileContents = fs.readFileSync(pathFromEnv, "utf-8");
      return JSON.parse(fileContents);
    } catch (error) {
      console.warn("Failed to read FIREBASE_SERVICE_ACCOUNT_PATH file.", error);
    }
  }

  return null;
};

const initialiseFirebase = () => {
  if (realtimeDb) return;

  const credentials = loadServiceAccount();
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!credentials || !databaseURL) {
    console.warn("Firebase Admin not fully configured. Falling back to in-memory store.");
    return;
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
        databaseURL,
      });
    }
    realtimeDb = admin.database();
    console.log("✅ Firebase Admin connected to Realtime Database");
  } catch (error) {
    console.error("Failed to initialise Firebase Admin SDK.", error);
    realtimeDb = null;
  }
};

initialiseFirebase();

const ensureProfile = async (username) => {
  if (!username) return;
  if (realtimeDb) {
    const profileRef = realtimeDb.ref(`profiles/${username}`);
    const snapshot = await profileRef.once("value");
    if (!snapshot.exists()) {
      await profileRef.set({
        username,
        profileScore: 0,
        level: "Novice",
        followers: 0,
        following: 0,
        avatarUrl: null,
        avatarUpdatedAt: 0,
        roles: [],
      });
    }
  } else {
    if (!memoryStore.profiles) {
      memoryStore.profiles = {};
    }
    if (!memoryStore.profiles[username]) {
      memoryStore.profiles[username] = {
        username,
        profileScore: 0,
        level: "Novice",
        followers: 0,
        following: 0,
        avatarUrl: null,
        avatarUpdatedAt: 0,
        roles: [],
      };
    }
  }
};

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    provider: realtimeDb ? "firebase" : "memory",
  });
});

app.get("/api/posts", async (req, res) => {
  const { sort = "new", query = "", username } = req.query;

  try {
    let posts = [];

    if (realtimeDb) {
      const snapshot = await realtimeDb.ref("posts").once("value");
      snapshot.forEach((child) => {
        posts.push({ id: child.key, ...child.val() });
      });
    } else {
      posts = [...memoryStore.posts];
    }

    if (username) {
      posts = posts.filter((post) => post.username === username);
    }

    if (query) {
      const lower = query.toLowerCase();
      posts = posts.filter((post) => {
        const contentMatch = (post.content || "").toLowerCase().includes(lower);
        const tagMatch = (post.tags || []).some((tag) => tag.toLowerCase().includes(lower));
        const usernameMatch = (post.username || "").toLowerCase().includes(lower);
        return contentMatch || tagMatch || usernameMatch;
      });
    }

    posts.sort((a, b) => {
      switch (sort) {
        case "hot": {
          const scoreA = ((a.likes || 0) * 2 + (a.comments || 0) * 3) /
            (1 + (Date.now() - (a.createdAt || 0)) / 3_600_000);
          const scoreB = ((b.likes || 0) * 2 + (b.comments || 0) * 3) /
            (1 + (Date.now() - (b.createdAt || 0)) / 3_600_000);
          return scoreB - scoreA;
        }
        case "top":
          return ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0));
        case "new":
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    res.json({ posts });
  } catch (error) {
    console.error("Failed to load posts", error);
    res.status(500).json({ success: false, error: "Failed to load posts." });
  }
});

app.post("/api/posts", async (req, res) => {
  const { username, content, tags = [], image = null, video = null } = req.body || {};
  const cleanUsername = sanitizeString(username);
  const cleanContent = sanitizeString(content);

  if (!cleanUsername) {
    return res.status(400).json({ success: false, error: "Username is required." });
  }

  if (!cleanContent) {
    return res.status(400).json({ success: false, error: "Content cannot be empty." });
  }

  const post = {
    id: createId(),
    username: cleanUsername,
    content: cleanContent,
    tags: Array.isArray(tags) ? tags : [],
    image,
    video,
    likes: 0,
    comments: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    await ensureProfile(cleanUsername);

    if (realtimeDb) {
      await realtimeDb.ref(`posts/${post.id}`).set(post);
    } else {
      memoryStore.posts.unshift(post);
    }

    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error("Failed to create post", error);
    res.status(500).json({ success: false, error: "Failed to create post." });
  }
});

app.post("/api/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;

  try {
    if (realtimeDb) {
      const postRef = realtimeDb.ref(`posts/${postId}`);
      const snapshot = await postRef.once("value");
      if (!snapshot.exists()) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }
      const current = snapshot.val();
      const likes = (current.likes || 0) + 1;
      await postRef.update({ likes });
      return res.json({ success: true, post: { id: postId, ...current, likes } });
    }

    const post = memoryStore.posts.find((item) => item.id === postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }
    post.likes = (post.likes || 0) + 1;
    res.json({ success: true, post });
  } catch (error) {
    console.error("Failed to like post", error);
    res.status(500).json({ success: false, error: "Failed to like post." });
  }
});

app.patch("/api/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { username, content, tags, image, video } = req.body || {};

  try {
    if (realtimeDb) {
      const postRef = realtimeDb.ref(`posts/${postId}`);
      const snapshot = await postRef.once("value");
      if (!snapshot.exists()) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }
      const current = snapshot.val();
      if (sanitizeString(username || current.username) !== current.username) {
        return res.status(403).json({ success: false, error: "Not authorised to edit this post." });
      }

      const updates = {};
      if (typeof content === "string") {
        updates.content = sanitizeString(content);
        updates.tags = Array.isArray(tags) ? tags : current.tags || [];
      }
      if (typeof image !== "undefined") {
        updates.image = image;
      }
      if (typeof video !== "undefined") {
        updates.video = video;
      }
      updates.updatedAt = Date.now();

      await postRef.update(updates);
      return res.json({ success: true, post: { id: postId, ...current, ...updates } });
    }

    const post = memoryStore.posts.find((item) => item.id === postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found." });
    }
    if (sanitizeString(username || post.username) !== post.username) {
      return res.status(403).json({ success: false, error: "Not authorised to edit this post." });
    }
    if (typeof content === "string") {
      post.content = sanitizeString(content);
      post.tags = Array.isArray(tags) ? tags : post.tags;
    }
    if (typeof image !== "undefined") {
      post.image = image;
    }
    if (typeof video !== "undefined") {
      post.video = video;
    }
    post.updatedAt = Date.now();

    res.json({ success: true, post });
  } catch (error) {
    console.error("Failed to update post", error);
    res.status(500).json({ success: false, error: "Failed to update post." });
  }
});

app.delete("/api/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const { username } = req.body || {};
  const cleanUsername = sanitizeString(username);

  try {
    if (realtimeDb) {
      const postRef = realtimeDb.ref(`posts/${postId}`);
      const snapshot = await postRef.once("value");
      if (!snapshot.exists()) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }
      const current = snapshot.val();
      if (cleanUsername && current.username !== cleanUsername) {
        return res.status(403).json({ success: false, error: "Not authorised to delete this post." });
      }

      await postRef.remove();
      await realtimeDb.ref("comments")
        .orderByChild("postId")
        .equalTo(postId)
        .once("value", (commentsSnapshot) => {
          commentsSnapshot.forEach((child) => {
            child.ref.remove();
          });
        });
    } else {
      const index = memoryStore.posts.findIndex((post) => post.id === postId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }
      const post = memoryStore.posts[index];
      if (cleanUsername && post.username !== cleanUsername) {
        return res.status(403).json({ success: false, error: "Not authorised to delete this post." });
      }
      memoryStore.posts.splice(index, 1);
      memoryStore.comments = memoryStore.comments.filter((comment) => comment.postId !== postId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete post", error);
    res.status(500).json({ success: false, error: "Failed to delete post." });
  }
});

app.get("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;

  try {
    let comments = [];

    if (realtimeDb) {
      const snapshot = await realtimeDb.ref("comments")
        .orderByChild("postId")
        .equalTo(postId)
        .once("value");
      snapshot.forEach((child) => {
        comments.push({ id: child.key, ...child.val() });
      });
    } else {
      comments = memoryStore.comments.filter((comment) => comment.postId === postId);
    }

    comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    res.json({ comments });
  } catch (error) {
    console.error("Failed to load comments", error);
    res.status(500).json({ success: false, error: "Failed to load comments." });
  }
});

app.post("/api/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { username, content, guided = false } = req.body || {};

  const cleanUsername = sanitizeString(username);
  const cleanContent = sanitizeString(content);

  if (!cleanUsername) {
    return res.status(400).json({ success: false, error: "Username is required." });
  }

  if (!cleanContent) {
    return res.status(400).json({ success: false, error: "Comment cannot be empty." });
  }

  const comment = {
    id: createId(),
    postId,
    username: cleanUsername,
    content: cleanContent,
    guided: Boolean(guided),
    createdAt: Date.now(),
  };

  try {
    if (realtimeDb) {
      const postSnapshot = await realtimeDb.ref(`posts/${postId}`).once("value");
      if (!postSnapshot.exists()) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }

      await ensureProfile(cleanUsername);
      await realtimeDb.ref(`comments/${comment.id}`).set(comment);
      await realtimeDb.ref(`posts/${postId}`).update({
        comments: (postSnapshot.val().comments || 0) + 1,
      });
    } else {
      const post = memoryStore.posts.find((item) => item.id === postId);
      if (!post) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }
      memoryStore.comments.push(comment);
      post.comments = (post.comments || 0) + 1;
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error("Failed to create comment", error);
    res.status(500).json({ success: false, error: "Failed to create comment." });
  }
});

app.delete("/api/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { username, uid } = req.body || {};
  const cleanUsername = sanitizeString(username);
  const cleanUid = sanitizeString(uid);

  if (!cleanUsername) {
    return res.status(400).json({ success: false, error: "Username is required." });
  }

  try {
    if (realtimeDb) {
      const commentRef = realtimeDb.ref(`comments/${commentId}`);
      const snapshot = await commentRef.once("value");
      if (!snapshot.exists()) {
        return res.status(404).json({ success: false, error: "Comment not found." });
      }

      const comment = snapshot.val();
      const ownsByUsername = !comment.username || comment.username === cleanUsername;
      const ownsByUid = !comment.uid || (cleanUid && comment.uid === cleanUid);

      if (!ownsByUsername && !ownsByUid) {
        return res.status(403).json({ success: false, error: "Not authorised to delete this comment." });
      }

      await commentRef.remove();

      if (comment.postId) {
        const postRef = realtimeDb.ref(`posts/${comment.postId}`);
        await postRef.transaction((post) => {
          if (post) {
            post.comments = Math.max(0, (post.comments || 1) - 1);
          }
          return post;
        });
      }
    } else {
      const commentIndex = memoryStore.comments.findIndex((c) => c.id === commentId);
      if (commentIndex === -1) {
        return res.status(404).json({ success: false, error: "Comment not found." });
      }

      const comment = memoryStore.comments[commentIndex];
      if (comment.username !== cleanUsername) {
        return res.status(403).json({ success: false, error: "Not authorised to delete this comment." });
      }

      memoryStore.comments.splice(commentIndex, 1);

      if (comment.postId) {
        const post = memoryStore.posts.find((p) => p.id === comment.postId);
        if (post) {
          post.comments = Math.max(0, (post.comments || 1) - 1);
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete comment", error);
    res.status(500).json({ success: false, error: "Failed to delete comment." });
  }
});

app.post("/api/users/rename", async (req, res) => {
  const { oldUsername, newUsername } = req.body || {};
  const from = sanitizeString(oldUsername);
  const to = sanitizeString(newUsername);

  if (!from || !to) {
    return res.status(400).json({ success: false, error: "Both usernames are required." });
  }

  if (from === to) {
    return res.json({ success: true, unchanged: true, username: to });
  }

  try {
    if (realtimeDb) {
      const targetProfileRef = realtimeDb.ref(`profiles/${to}`);
      const existingProfile = await targetProfileRef.once("value");
      if (existingProfile.exists()) {
        return res.status(409).json({ success: false, error: "Username already exists." });
      }

      const oldProfileRef = realtimeDb.ref(`profiles/${from}`);
      const oldSnapshot = await oldProfileRef.once("value");

      const profileData = oldSnapshot.exists()
        ? { ...oldSnapshot.val(), username: to }
        : { username: to, profileScore: 0, level: "Novice", followers: 0, following: 0, avatarUrl: null, avatarUpdatedAt: 0, roles: [] };

      await targetProfileRef.set(profileData);
      await oldProfileRef.remove();

      const postsSnapshot = await realtimeDb.ref("posts").orderByChild("username").equalTo(from).once("value");
      postsSnapshot.forEach((child) => {
        child.ref.update({ username: to });
      });

      const commentsSnapshot = await realtimeDb.ref("comments").orderByChild("username").equalTo(from).once("value");
      commentsSnapshot.forEach((child) => {
        child.ref.update({ username: to });
      });
    } else {
      if (!memoryStore.profiles) {
        memoryStore.profiles = {};
      }
      if (memoryStore.profiles[to]) {
        return res.status(409).json({ success: false, error: "Username already exists." });
      }
      const profile = memoryStore.profiles[from] || {
        username: from,
        profileScore: 0,
        level: "Novice",
        followers: 0,
        following: 0,
        avatarUrl: null,
        avatarUpdatedAt: 0,
        roles: [],
      };
      memoryStore.profiles[to] = { ...profile, username: to };
      delete memoryStore.profiles[from];

      memoryStore.posts = memoryStore.posts.map((post) =>
        post.username === from ? { ...post, username: to } : post
      );

      memoryStore.comments = memoryStore.comments.map((comment) =>
        comment.username === from ? { ...comment, username: to } : comment
      );
    }

    res.json({ success: true, username: to });
  } catch (error) {
    console.error("Failed to rename user", error);
    res.status(500).json({ success: false, error: "Failed to rename user." });
  }
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`✅ EcoVest+ API available on http://localhost:${PORT}`);
    if (!realtimeDb) {
      console.warn("Running in memory mode. Configure Firebase environment variables to use Realtime Database.");
    }
  });
};

startServer();
