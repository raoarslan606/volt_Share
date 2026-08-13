import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Send, Phone, User, Zap } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Message } from '../types';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  const { token, user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract user IDs and station ID from conversationId string format: userA:userB:stationId
  const parts = conversationId ? conversationId.split(':') : [];
  const userAId = parts[0] || '';
  const userBId = parts[1] || '';
  const stationId = parts[2] || '';
  const receiverId = user?.id === userAId ? userBId : userAId;

  // 1. Load initial history via REST API
  useEffect(() => {
    if (!userAId || !userBId || !stationId) return;

    api
      .get(`/messages/${userAId}/${userBId}/${stationId}`)
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error('Failed to load history', err));
  }, [userAId, userBId, stationId]);

  // 2. Connect Socket.io
  useEffect(() => {
    if (!token) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socketClient = io(`${API_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketClient.on('connect', () => console.log('Socket connected'));
    socketClient.on('receiveMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });
    socketClient.on('messageSent', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !receiverId || !stationId) return;

    socket.emit('sendMessage', {
      receiverId,
      stationId,
      text: input.trim(),
    });

    setInput('');
  };

  return (
    <div className="h-[calc(100vh-64px)] bg-navy-950 flex flex-col">
      {/* Header */}
      <div className="glass-card border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 font-bold flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">Station Coordination Chat</div>
            <div className="text-[10px] text-brand-400 font-medium">Realtime Direct Messaging</div>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isMe
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-slate-950 font-medium rounded-br-none shadow-lg shadow-brand-500/10'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 glass-card border-t border-slate-800 flex items-center space-x-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
