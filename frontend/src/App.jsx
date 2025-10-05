import React, { useState, useEffect, useRef } from 'react';
import { Clock, Users, MapPin, MessageCircle, Plus, X, Check, Hash, Calendar, Send, LogOut, User, Shield, Trash2, Eye } from 'lucide-react';
import { authAPI, threadsAPI, adminAPI } from './services/api';

const formatTime = (dateString) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const getTimeRemaining = (expiresAt) => {
  const diff = new Date(expiresAt) - new Date();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Expiring soon';
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const chatEndRef = useRef(null);

  const [showEditForm, setShowEditForm] = useState(false);
const [editingThread, setEditingThread] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.chat]);

  useEffect(() => {
    if (currentUser && !showLoginForm) {
      loadThreads();
      const interval = setInterval(loadThreads, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, showLoginForm]);

  useEffect(() => {
    if (currentUser?.isAdmin && showAdminDashboard) {
      loadAdminDashboard();
    }
  }, [currentUser, showAdminDashboard]);

  const loadThreads = async () => {
    try {
      const response = await threadsAPI.getAll();
      if (response.data.success) {
        setThreads(response.data.threads);
        if (selectedThread) {
          const updatedThread = response.data.threads.find(t => t.id === selectedThread.id);
          if (updatedThread) {
            setSelectedThread(updatedThread);
          } else {
            setSelectedThread(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading threads:', error);
    }
  };

  const loadAdminDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard(currentUser.id);
      if (response.data.success) {
        setAdminData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    }
  };

  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
      if (!username.trim() || (isAdminLogin && !password.trim())) {
        setError('Please fill in all fields');
        return;
      }
      setLoginLoading(true);
      setError('');
      try {
        const response = await authAPI.login(username, password, isAdminLogin);
        if (response.data.success) {
          setCurrentUser(response.data.user);
          setShowLoginForm(false);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
      setLoginLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isAdminLogin ? 'Admin Login' : 'Welcome to EventThreads'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isAdminLogin ? 'Access admin dashboard' : 'Connect with others through temporary interest-based events'}
          </p>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div>
            <input
              type="text"
              placeholder={isAdminLogin ? "Admin username" : "Enter your username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isAdminLogin && (
              <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors mb-3 disabled:opacity-50"
            >
              {loginLoading ? 'Logging in...' : (isAdminLogin ? 'Admin Login' : 'Join EventThreads')}
            </button>
            <button
              onClick={() => {
                setIsAdminLogin(!isAdminLogin);
                setUsername('');
                setPassword('');
                setError('');
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-800"
            >
              {isAdminLogin ? '← Back to regular login' : 'Admin Login →'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
  const handleDeleteThread = async (threadId) => {
    if (window.confirm('Are you sure you want to delete this thread?')) {
      try {
        const result = await threadsAPI.delete(threadId, currentUser.id);
        if (result.data.success) {
          loadAdminDashboard();
          loadThreads();
        }
      } catch (error) {
        alert('Error deleting thread');
      }
    }
  };

  const handleViewThread = (thread) => {
    // Format thread data properly before viewing
    const formattedThread = {
      id: thread.id,
      title: thread.title,
      description: thread.description,
      creator: thread.creator,
      creatorId: thread.creatorId,
      location: thread.location,
      tags: thread.tags || [],
      expiresAt: thread.expiresAt,
      members: thread.members || [],
      pendingRequests: thread.pendingRequests || [],
      chat: thread.chat || [],
      createdAt: thread.createdAt
    };
    
    setSelectedThread(formattedThread);
    setShowAdminDashboard(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="opacity-90">Monitor all threads and users</p>
          </div>
          <button onClick={() => setShowAdminDashboard(false)} className="text-white hover:text-blue-200">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Threads</h3>
            <p className="text-3xl font-bold text-blue-600">{adminData?.totalThreads || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Users</h3>
            <p className="text-3xl font-bold text-green-600">{adminData?.activeUsers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-purple-600">{adminData?.totalUsers || 0}</p>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Threads</h2>
          {!adminData?.threads || adminData.threads.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No active threads</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminData.threads.map(thread => (
                <div key={thread.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{thread.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{thread.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>👤 {thread.creator}</span>
                        <span>📍 {thread.location}</span>
                        <span>⏰ {getTimeRemaining(thread.expiresAt)}</span>
                        <span>👥 {thread.members?.length || 0} members</span>
                        <span>💬 {thread.chat?.length || 0} messages</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Members:</strong> {thread.memberDetails?.map(m => m.username).join(', ') || 'None'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewThread(thread)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Thread"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteThread(thread.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Users</h2>
          {!adminData?.users || adminData.users.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No users yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Username</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminData.users.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  const CreateThreadForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      location: '',
      tags: '',
      duration: '2'
    });

    const handleSubmit = async () => {
      if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) return;
      setLoading(true);
      const threadData = {
        title: formData.title,
        description: formData.description,
        creator: currentUser.username,
        creatorId: currentUser.id,
        location: formData.location,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        expiresAt: new Date(Date.now() + parseInt(formData.duration) * 60 * 60 * 1000).toISOString()
      };
      try {
        const result = await threadsAPI.create(threadData);
        if (result.data.success) {
          setShowCreateForm(false);
          setFormData({ title: '', description: '', location: '', tags: '', duration: '2' });
          loadThreads();
        }
      } catch (error) {
        alert('Error creating thread');
      }
      setLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Event Thread</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                placeholder="e.g., Coffee & Code meetup"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="What's this event about?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="e.g., Starbucks Downtown"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                placeholder="coffee, coding, social (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const EditThreadForm = () => {
  const [formData, setFormData] = useState({
    title: editingThread?.title || '',
    description: editingThread?.description || '',
    location: editingThread?.location || '',
    tags: editingThread?.tags?.join(', ') || ''
  });

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) return;
    setLoading(true);

    const updateData = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      userId: currentUser.id
    };

    try {
      const result = await threadsAPI.update(editingThread.id, updateData);
      if (result.data.success) {
        setShowEditForm(false);
        setEditingThread(null);
        loadThreads();
        alert('Thread updated successfully!');
      }
    } catch (error) {
      alert('Error updating thread');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Thread</h2>
          <button onClick={() => {
            setShowEditForm(false);
            setEditingThread(null);
          }} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
            <input
              type="text"
              placeholder="e.g., Coffee & Code meetup"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="What's this event about?"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g., Starbucks Downtown"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input
              type="text"
              placeholder="coffee, coding, social (comma separated)"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowEditForm(false);
                setEditingThread(null);
              }}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Thread'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  const ChatView = () => {
  if (!selectedThread) return null;
  const isCreator = selectedThread.creatorId === currentUser.id;
  const isMember = selectedThread.members.includes(currentUser.id);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messageData = {
      user: currentUser.username,
      userId: currentUser.id,
      message: newMessage.trim()
    };
    try {
      const result = await threadsAPI.sendMessage(selectedThread.id, messageData);
      if (result.data.success) {
        setNewMessage('');
        loadThreads();
      }
    } catch (error) {
      alert('Error sending message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRequest = async (userId, approve) => {
    try {
      const result = await threadsAPI.handleRequest(selectedThread.id, userId, approve, currentUser.id);
      if (result.data.success) {
        loadThreads();
      }
    } catch (error) {
      alert('Error handling request');
    }
  };

  const getUsernameById = (userId) => {
    if (userId === currentUser?.id) return currentUser.username;
    return `User_${userId.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedThread(null)} className="text-gray-600 hover:text-gray-800">
            ← Back
          </button>
          <div className="text-center flex-1">
            <h2 className="font-semibold text-gray-900">{selectedThread.title}</h2>
            <p className="text-sm text-gray-500">{selectedThread.members.length} members • {getTimeRemaining(selectedThread.expiresAt)} left</p>
          </div>
          <div className="w-6"></div>
        </div>
      </div>
      {isCreator && selectedThread.pendingRequests.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 p-4">
          <h3 className="font-medium text-orange-900 mb-2">Join Requests ({selectedThread.pendingRequests.length})</h3>
          <div className="space-y-2">
            {selectedThread.pendingRequests.map(userId => (
              <div key={userId} className="flex items-center justify-between bg-white p-2 rounded-lg">
                <span className="text-sm font-medium">{getUsernameById(userId)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(userId, false)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRequest(userId, true)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-container">
        {selectedThread.chat.map(msg => (
          <div key={msg.id} className={`flex ${msg.user === currentUser.username ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.user === currentUser.username
                ? 'bg-blue-600 text-white'
                : msg.user === 'System'
                ? 'bg-gray-100 text-gray-600 text-center text-sm'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {msg.user !== currentUser.username && msg.user !== 'System' && (
                <div className="text-xs font-medium mb-1 opacity-70">{msg.user}</div>
              )}
              <div className="text-sm">{msg.message}</div>
              <div className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {isMember && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

  if (showLoginForm) return <LoginForm />;
  if (showAdminDashboard) return <AdminDashboard />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EventThreads</h1>
              <p className="text-sm text-gray-600">Temporary interest-based connections</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Hi, {currentUser.username}!</span>
              {currentUser.isAdmin && (
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowLoginForm(true);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Event Thread
          </button>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Threads ({threads.length})
          </h2>
          {threads.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active threads</h3>
              <p className="text-gray-600 mb-4">Be the first to create an event thread!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Thread
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {threads.map(thread => {
                const isCreator = thread.creatorId === currentUser.id;
                const isMember = thread.members.includes(currentUser.id);
                const hasPendingRequest = thread.pendingRequests.includes(currentUser.id);
                const hasPendingRequests = isCreator && thread.pendingRequests.length > 0;
                return (
                  <div key={thread.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{thread.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{thread.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{thread.creator}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{thread.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeRemaining(thread.expiresAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{thread.members.length} members</span>
                          {hasPendingRequests && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              {thread.pendingRequests.length} pending
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {thread.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              <Hash className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
  {isCreator && (
    <button
      onClick={() => {
        setEditingThread(thread);
        setShowEditForm(true);
      }}
      className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
    >
      Edit
    </button>
  )}
  {isMember ? (
    <button
      onClick={() => setSelectedThread(thread)}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1"
    >
      <MessageCircle className="w-4 h-4" />
      Chat ({thread.chat.length})
    </button>
  ) : hasPendingRequest ? (
    <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg flex-1 cursor-not-allowed">
      Request Pending...
    </button>
  ) : (
    <button
      onClick={async () => {
        try {
          await threadsAPI.requestJoin(thread.id, currentUser.id);
          loadThreads();
        } catch (error) {
          alert('Error sending join request');
        }
      }}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1"
    >
      <Plus className="w-4 h-4" />
      Request to Join
    </button>
  )}
  {hasPendingRequests && (
    <button
      onClick={() => setSelectedThread(thread)}
      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
    >
      Review Requests
    </button>
  )}
</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      {showCreateForm && <CreateThreadForm />}
      {showEditForm && <EditThreadForm />}
      {selectedThread && <ChatView />}
    </div>
  );
}

export default App;
