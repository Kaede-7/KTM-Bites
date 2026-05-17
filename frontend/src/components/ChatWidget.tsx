import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/chat-widget.css';
import { sendChatMessage, type ChatMessage, type RecommendedItem } from '../api/ai';
import { addToCart } from '../api/cart';
import { isLoggedIn } from '../api/auth';

const QUICK_CHIPS = [
  '🌱 Vegan options?',
  '🔥 What\'s most popular?',
  '💰 Under Rs. 300?',
  '🌶️ Spicy dishes?',
];

const HIDDEN_ROUTES = ['/login', '/signup', '/admin', '/kitchen', '/rider'];

const ChatWidget: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    if (!isLoggedIn()) {
      const userMsg: ChatMessage = { role: 'user', content: msg };
      setMessages(prev => [...prev, userMsg, {
        role: 'assistant',
        content: "Please login first to chat with me and get personalized recommendations! 😊",
      }]);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { reply, items } = await sendChatMessage(msg, messages);
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply, items };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🙏",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (item: RecommendedItem) => {
    if (!isLoggedIn()) { window.location.href = '/login'; return; }
    try {
      await addToCart(item.id, 1);
      setAddedItems(prev => new Set(prev).add(item.id));
      setTimeout(() => setAddedItems(prev => {
        const next = new Set(prev); next.delete(item.id); return next;
      }), 2000);
    } catch { /* silent */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (location.pathname === '/' || HIDDEN_ROUTES.some(r => location.pathname.startsWith(r))) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        id="chat-widget-trigger"
        className={`chat-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open food concierge"
      >
        <span className="material-symbols-rounded">
          {open ? 'close' : 'restaurant'}
        </span>
      </button>

      {/* Chat panel */}
      {open && (
        <div id="chat-widget-panel" className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">
              <span className="material-symbols-rounded">smart_toy</span>
            </div>
            <div className="chat-header-info">
              <div className="chat-header-name">KTM Food Concierge</div>
              <div className="chat-header-status">
                <span className="chat-status-dot" />
                Online
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close chat">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🍜</div>
                <h4>Hey! I'm your food guide.</h4>
                <p>Ask me anything about the menu — from allergens to what's perfect for your mood today.</p>
                <div className="chat-chips">
                  {QUICK_CHIPS.map(chip => (
                    <button key={chip} className="chat-chip" onClick={() => handleSend(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="chat-bubble">{msg.content}</div>
                {msg.role === 'assistant' && msg.items && msg.items.length > 0 && (
                  <div className="chat-item-cards">
                    {msg.items.map(item => (
                      <div key={item.id} className="chat-item-card">
                        <img src={item.image} alt={item.name} />
                        <div className="chat-item-card-info">
                          <div className="chat-item-card-name">{item.name}</div>
                          <div className="chat-item-card-price">Rs. {item.price}</div>
                        </div>
                        <button
                          className={`chat-item-add-btn ${addedItems.has(item.id) ? 'added' : ''}`}
                          onClick={() => handleAddToCart(item)}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <span className="material-symbols-rounded">
                            {addedItems.has(item.id) ? 'check' : 'add'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-typing">
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                  <div className="chat-typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              id="chat-input-field"
              className="chat-input"
              rows={1}
              placeholder="Ask about the menu..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              id="chat-send-btn"
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <span className="material-symbols-rounded">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
