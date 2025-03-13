import React, { createContext, useContext, useState, ReactNode } from 'react';

// 消息类型
export interface Message {
  id: string;
  content: string | any; // 支持字符串或复杂对象（如建议列表）
  role: 'user' | 'assistant' | 'system' | 'suggestion' | 'file';
  timestamp: Date;
  loading?: boolean; // 加载状态
}

// 聊天上下文类型
interface ChatContextType {
  messages: Message[];
  addMessage: (
    content: string | any, 
    role: 'user' | 'assistant' | 'system' | 'suggestion' | 'file',
    replaceId?: string,
    loading?: boolean
  ) => void;
  clearMessages: (newMessages?: Message[]) => void;
  isNewChat: boolean;
  setIsNewChat: (isNew: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  deleteMessage: (id: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewChat, setIsNewChat] = useState(true);
  const [loading, setLoading] = useState(false);

  // 添加消息
  const addMessage = (
    content: string | any, 
    role: 'user' | 'assistant' | 'system' | 'suggestion' | 'file',
    replaceId?: string,
    loading?: boolean
  ) => {
    const newMessage: Message = {
      id: replaceId || Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
      loading
    };

    if (replaceId) {
      // 替换现有消息
      setMessages((prev) => 
        prev.map(msg => msg.id === replaceId ? newMessage : msg)
      );
    } else {
      // 添加新消息
      setMessages((prev) => [...prev, newMessage]);
    }
  };

  // 删除消息
  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter(msg => msg.id !== id));
  };

  // 清空消息或加载新的消息集
  const clearMessages = (newMessages?: Message[]) => {
    // 检查newMessages是否为数组
    if (Array.isArray(newMessages)) {
      if (newMessages.length > 0) {
        // 加载新的消息集
        setMessages(newMessages);
        setIsNewChat(false);
      } else {
        // 如果提供了空数组，清空所有消息
        setMessages([]);
        setIsNewChat(true);
      }
    } else {
      // 未提供参数或参数不是数组，清空所有消息
      setMessages([]);
      setIsNewChat(true);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        addMessage,
        clearMessages,
        isNewChat,
        setIsNewChat,
        loading,
        setLoading,
        deleteMessage,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 