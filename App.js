import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // For unique message IDs

// --- Context for Authentication ---
const AuthContext = createContext(null);

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial loading state

  useEffect(() => {
    // Check localStorage on initial load
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setLoading(false); // Authentication check complete
  }, []);

  const login = (username, password) => {
    // In a real app, this would validate against a backend.
    // Here, we're just simulating success if username and password are provided.
    if (username && password) {
      const userData = { username }; // Store only username for simplicity
      localStorage.setItem('loggedInUser', JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem(`messages_${user?.username}`); // Clear user's messages on logout
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
const useAuth = () => {
  return useContext(AuthContext);
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// --- Login Page Component ---
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Simple validation
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    if (login(username, password)) {
      navigate('/home');
    } else {
      setError('Invalid username or password.'); // This should ideally not happen with current login logic
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Welcome!</h2>
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Layout Component for authenticated routes ---
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">Messaging App</h1>
        <div className="header-user-info">
          {user && (
            <span className="user-text">
              Logged in as: <span className="user-highlight">{user.username}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="btn btn-logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <ul className="nav-list">
          <li>
            <button
              onClick={() => navigate('/home')}
              className="nav-button"
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/send')}
              className="nav-button"
            >
              Send Message
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/messages')}
              className="nav-button"
            >
              All Messages
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

// --- Home/Dashboard Component ---
const HomePage = () => {
  const { user } = useAuth();
  return (
    <AppLayout>
      <div className="dashboard-card">
        <h2 className="dashboard-title">
          Welcome, {user?.username}!
        </h2>
        <p className="dashboard-subtitle">
          This is your personal messaging dashboard.
        </p>
        <div className="dashboard-buttons">
          <button
            onClick={() => window.location.href = '/send'}
            className="btn btn-dashboard-send"
          >
            Send a New Message
          </button>
          <button
            onClick={() => window.location.href = '/messages'}
            className="btn btn-dashboard-view"
          >
            View All Messages
          </button>
        </div>
      </div>
    </AppLayout>
  );
};


// --- Send Message Page Component ---
const SendMessagePage = () => {
  const [messageText, setMessageText] = useState('');
  const [feedback, setFeedback] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setFeedback('Message cannot be empty.');
      return;
    }

    const newMessage = {
      id: uuidv4(), // Unique ID for each message
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    const userMessagesKey = `messages_${user.username}`;
    const existingMessages = JSON.parse(localStorage.getItem(userMessagesKey) || '[]');
    existingMessages.push(newMessage);
    localStorage.setItem(userMessagesKey, JSON.stringify(existingMessages));

    setMessageText('');
    setFeedback('Message sent successfully!');
    setTimeout(() => setFeedback(''), 3000); // Clear feedback after 3 seconds
  };

  return (
    <AppLayout>
      <div className="message-form-card">
        <h2 className="message-form-title">Send a New Message</h2>
        <form onSubmit={handleSubmit} className="message-form">
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Your Message
            </label>
            <textarea
              id="message"
              rows="6"
              className="form-textarea"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              required
            ></textarea>
          </div>
          {feedback && (
            <p className={`feedback-message ${feedback.includes('successfully') ? 'success' : 'error'}`}>
              {feedback}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Send Message
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

// --- All Messages Page Component ---
const AllMessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedMessageText, setEditedMessageText] = useState('');

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = () => {
    const userMessagesKey = `messages_${user.username}`;
    const storedMessages = JSON.parse(localStorage.getItem(userMessagesKey) || '[]');
    setMessages(storedMessages);
  };

  const deleteMessage = (idToDelete) => {
    // For demonstration, using alert. In a real app, use a custom modal for confirmation.
    if (window.confirm("Are you sure you want to delete this message?")) {
      const userMessagesKey = `messages_${user.username}`;
      const updatedMessages = messages.filter(msg => msg.id !== idToDelete);
      localStorage.setItem(userMessagesKey, JSON.stringify(updatedMessages));
      setMessages(updatedMessages);
    }
  };

  const startEdit = (message) => {
    setEditingMessageId(message.id);
    setEditedMessageText(message.text);
  };

  const saveEdit = (idToUpdate) => {
    if (!editedMessageText.trim()) {
      alert("Edited message cannot be empty.");
      return;
    }

    const userMessagesKey = `messages_${user.username}`;
    const updatedMessages = messages.map(msg =>
      msg.id === idToUpdate
        ? { ...msg, text: editedMessageText, timestamp: new Date().toISOString() + ' (edited)' }
        : msg
    );
    localStorage.setItem(userMessagesKey, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    setEditingMessageId(null);
    setEditedMessageText('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText('');
  };

  return (
    <AppLayout>
      <div className="messages-list-container">
        <h2 className="messages-list-title">Your Messages</h2>

        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">You haven't sent any messages yet.</p>
            <p className="empty-state-text">
              Go to <a href="/send" className="empty-state-link">Send Message</a> to get started!
            </p>
          </div>
        ) : (
          <div className="message-cards-wrapper">
            {messages.map((message) => (
              <div
                key={message.id}
                className="message-card"
              >
                {editingMessageId === message.id ? (
                  <div className="message-edit-area">
                    <textarea
                      value={editedMessageText}
                      onChange={(e) => setEditedMessageText(e.target.value)}
                      className="message-edit-textarea"
                      rows="3"
                    />
                    <div className="message-edit-buttons">
                      <button
                        onClick={() => saveEdit(message.id)}
                        className="btn btn-save-edit"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn btn-cancel-edit"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="message-content">
                      <p className="message-text">{message.text}</p>
                      <p className="message-timestamp">
                        Sent on: {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="message-actions">
                      <button
                        onClick={() => startEdit(message)}
                        className="btn btn-edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};


// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/send"
              element={
                <ProtectedRoute>
                  <SendMessagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <AllMessagesPage />
                </ProtectedRoute>
              }
            />
            {/* Redirect root to login or home based on auth state */}
            <Route
              path="/"
              element={<Navigate to={localStorage.getItem('loggedInUser') ? '/home' : '/login'} replace />}
            />
            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;

