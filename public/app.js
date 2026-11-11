let currentUser = null;

async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  alert(data.message || data.error);
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.username) {
    currentUser = data.username;
    document.getElementById('user-display').innerText = `Logged in as: ${currentUser}`;
    alert("Logged in successfully!");
  } else {
    alert(data.error);
  }
}

async function loadFeed() {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const feedEl = document.getElementById('feed');
  feedEl.innerHTML = '';

  for (let post of posts) {
    const commentsRes = await fetch(`/api/posts/${post.id}/comments`);
    const comments = await commentsRes.json();
    
    let commentsHtml = comments.map(c => `<div class="comment"><strong>${c.username}:</strong> ${c.text}</div>`).join('');

    feedEl.innerHTML += `
      <div class="post-card">
        <div class="post-header">@${post.username}</div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
          <button onclick="likePost(${post.id})">👍 Like (${post.likes})</button>
        </div>
        <div class="comments-section">
          <div id="comments-${post.id}">${commentsHtml}</div>
          <div class="comment-input-box">
            <input type="text" id="input-${post.id}" placeholder="Write a comment...">
            <button onclick="addComment(${post.id})">Reply</button>
          </div>
        </div>
      </div>
    `;
  }
}

async function createPost() {
  if (!currentUser) return alert("Please log in to share a post.");
  const content = document.getElementById('post-content').value;
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: currentUser, content })
  });
  const data = await res.json();
  if (data.message) {
    document.getElementById('post-content').value = '';
    loadFeed();
  } else {
    alert(data.error);
  }
}

async function likePost(postId) {
  await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
  loadFeed();
}

async function addComment(postId) {
  if (!currentUser) return alert("Please log in to comment.");
  const inputEl = document.getElementById(`input-${postId}`);
  const text = inputEl.value;
  if (!text) return;

  await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: currentUser, text })
  });
  inputEl.value = '';
  loadFeed();
}

loadFeed();