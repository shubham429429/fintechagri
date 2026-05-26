import { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const CATEGORIES = [
  { key: 'all', label: '🌐 All' },
  { key: 'general', label: '💬 General' },
  { key: 'price_tip', label: '💰 Price Tips' },
  { key: 'storage', label: '🏠 Storage' },
  { key: 'question', label: '❓ Questions' },
];

export default function SocialHub() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('all');
  const [newPost, setNewPost] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});

  const fetchPosts = async () => {
    setLoading(true); setError(null);
    try { setPosts(await postsAPI.getAll(category)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [category]);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    try { await postsAPI.create(newPost, newCategory); setNewPost(''); setNewCategory('general'); fetchPosts(); }
    catch (err) { alert(err.message); }
  };

  const handleLike = async (postId) => {
    try { const updated = await postsAPI.like(postId); setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes_count: updated.likes_count } : p))); }
    catch (err) { console.error(err); }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) { setExpandedComments((prev) => ({ ...prev, [postId]: false })); return; }
    try { setComments((prev) => ({ ...prev, [postId]: [] })); const data = await postsAPI.getComments(postId); setComments((prev) => ({ ...prev, [postId]: data })); setExpandedComments((prev) => ({ ...prev, [postId]: true })); }
    catch (err) { console.error(err); }
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try { await postsAPI.addComment(postId, text); setCommentText((prev) => ({ ...prev, [postId]: '' })); const data = await postsAPI.getComments(postId); setComments((prev) => ({ ...prev, [postId]: data })); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading community...</p></div>;
  if (error) return <div className="page-error"><p>⚠️ {error}</p><button className="btn btn-primary" onClick={fetchPosts}>Retry</button></div>;

  return (
    <div className="page active" style={{ display: 'block', animation: 'fadeSlide 0.3s ease' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Community Hub</h1>
          <p className="page-subtitle">Share tips, ask questions, and connect with farmers</p>
        </div>
      </div>

      {/* Composer */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <textarea placeholder="Share an update, tip, or question..." value={newPost} onChange={(e) => setNewPost(e.target.value)}
          style={{ width: '100%', minHeight: '80px', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', padding: '12px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', resize: 'vertical', marginBottom: '10px', boxSizing: 'border-box', background: 'var(--c-cream)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
            style={{ padding: '6px 12px', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', background: '#fff' }}>
            <option value="general">💬 General</option>
            <option value="price_tip">💰 Price Tip</option>
            <option value="storage">🏠 Storage</option>
            <option value="question">❓ Question</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleCreatePost} disabled={!newPost.trim()}>Post</button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(({ key, label }) => (
          <button key={key} onClick={() => setCategory(key)}
            className={`btn btn-sm ${category === key ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '2rem', marginBottom: '10px' }}>💬</p>
          <p style={{ color: 'var(--c-text-lt)' }}>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card" style={{ marginBottom: '12px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div className="farmer-avatar" style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}>
                {post.author_name?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--c-primary)', fontSize: '0.9rem' }}>{post.author_name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--c-text-lt)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {post.category !== 'general' && <span className="card-tag">{post.category}</span>}
                </div>
              </div>
            </div>
            {/* Content */}
            <p style={{ color: 'var(--c-text)', lineHeight: 1.6, fontSize: '0.92rem', marginBottom: '12px' }}>{post.content}</p>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--c-border)' }}>
              <button onClick={() => handleLike(post.id)} className="btn btn-xs btn-ghost" style={{ color: 'var(--c-down)' }}>
                ❤️ {post.likes_count || 0}
              </button>
              <button onClick={() => toggleComments(post.id)} className="btn btn-xs btn-ghost">
                💬 {post.comments_count || 0}
              </button>
            </div>
            {/* Comments */}
            {expandedComments[post.id] && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--c-cream-dk)' }}>
                {(comments[post.id] || []).map((c) => (
                  <div key={c.id} style={{ padding: '6px 0', fontSize: '0.82rem' }}>
                    <strong style={{ color: 'var(--c-primary)' }}>{c.author_name}:</strong>{' '}
                    <span style={{ color: 'var(--c-text-mid)' }}>{c.content}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input placeholder="Write a comment..." value={commentText[post.id] || ''}
                    onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }} />
                  <button onClick={() => handleAddComment(post.id)} className="btn btn-primary btn-xs">Send</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
