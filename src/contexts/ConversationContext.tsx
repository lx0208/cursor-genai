import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from './ChatContext';

// 会话类型
export interface Conversation {
  id: string;
  title: string;
  firstMessage?: string; // 第一条消息内容（用于显示对话摘要）
  lastMessageDate: Date; // 最后一条消息的日期
  messages: Message[]; // 该会话的所有消息
}

// 会话上下文类型
interface ConversationContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  // 添加新的对话
  addConversation: (title: string, messages?: Message[]) => string; // 返回新会话ID
  // 更新对话内容
  updateConversation: (id: string, messages: Message[]) => void;
  // 删除对话
  deleteConversation: (id: string) => void;
  // 设置当前活动对话
  setActiveConversation: (id: string | null) => void;
  // 获取特定对话
  getConversation: (id: string) => Conversation | undefined;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // 添加新的对话
  const addConversation = (title: string, messages: Message[] = []) => {
    const id = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id,
      title,
      firstMessage: messages.length > 0 ? 
        (typeof messages[0].content === 'string' ? messages[0].content : '新的对话') : 
        '新的对话',
      lastMessageDate: messages.length > 0 ? 
        messages[messages.length - 1].timestamp : 
        new Date(),
      messages
    };

    setConversations(prev => [...prev, newConversation]);
    return id;
  };

  // 更新对话内容
  const updateConversation = (id: string, messages: Message[]) => {
    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === id) {
          return {
            ...conv,
            firstMessage: messages.length > 0 ? 
              (typeof messages[0].content === 'string' ? messages[0].content : '新的对话') : 
              '新的对话',
            lastMessageDate: messages.length > 0 ? 
              messages[messages.length - 1].timestamp : 
              new Date(),
            messages
          };
        }
        return conv;
      })
    );
  };

  // 删除对话
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  // 设置当前活动对话
  const setActiveConversation = (id: string | null) => {
    setActiveConversationId(id);
  };

  // 获取特定对话
  const getConversation = (id: string) => {
    return conversations.find(conv => conv.id === id);
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        activeConversationId,
        addConversation,
        updateConversation,
        deleteConversation,
        setActiveConversation,
        getConversation
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}; 