import React, { useState, useRef, useEffect } from 'react';
import { Bubble, Sender, Welcome } from '@ant-design/x';
import { UserOutlined, RobotOutlined, FileOutlined } from '@ant-design/icons';
import { Button, Avatar, Space, Typography, Divider, type GetRef } from 'antd';
import { useLLM } from '../../contexts/LLMContext';
import { useChat } from '../../contexts/ChatContext';
import { useConversation } from '../../contexts/ConversationContext';
import './styles.css';

const { Text } = Typography;

// 模拟关联文件列表
const mockRelatedFiles = [
  { id: '1', name: '要望書001.csv', type: 'docx', url: '#' },
  { id: '2', name: '要望書002.csv', type: 'pdf', url: '#' },
  { id: '3', name: '要望書003.csv', type: 'xlsx', url: '#' },
];

// 简化的关联文件列表组件 - 只显示文件名，集成到消息气泡内
const InlineFileList = ({ files }: { files: any[] }) => {
  if (!files || files.length === 0) return null;
  
  return (
    <div className="inline-file-list">
      <Divider className="file-divider" />
      <Text type="secondary" className="file-list-title">関連ファイル:</Text>
      <div className="file-list">
        {files.map(file => (
          <div key={file.id} className="file-item">
            <FileOutlined className="file-icon" />
            <Text className="file-name">{file.name}</Text>
          </div>
        ))}
      </div>
    </div>
  );
};

// 简化的聊天功能
const ChatArea: React.FC = () => {
  const { selectedModel, chatMode } = useLLM();
  const { messages, addMessage, clearMessages, isNewChat, setIsNewChat } = useChat();
  const { 
    activeConversationId, 
    addConversation, 
    updateConversation, 
    setActiveConversation, 
    getConversation,
    conversations
  } = useConversation();
  
  // 输入框状态
  const [content, setContent] = useState('');
  const [inputLoading, setInputLoading] = useState(false);
  
  // 创建输入框引用
  const senderRef = useRef<GetRef<typeof Sender>>(null);
  // 标记是否为新会话
  const isNewConversationRef = useRef<boolean>(true);
  // 防止更新循环的标记
  const isUpdatingRef = useRef<boolean>(false);
  // 上一个活动会话ID
  const prevActiveIdRef = useRef<string | null>(null);
  
  // 保持输入框聚焦
  useEffect(() => {
    // 初始化时聚焦
    setTimeout(() => {
      senderRef.current?.focus();
    }, 100);
    
    // 添加消息后重新聚焦
    if (!inputLoading) {
      setTimeout(() => {
        senderRef.current?.focus();
      }, 100);
    }
  }, [messages, inputLoading]);
  
  // 强制清空消息
  const forceEmptyMessages = () => {
    isUpdatingRef.current = true;
    // 确保完全清空状态 - 使用空数组作为参数调用clearMessages
    clearMessages([]);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };
  
  // 加载会话消息 - 只在activeConversationId变化时执行
  useEffect(() => {
    // 防止重复处理相同的会话ID
    if (activeConversationId !== prevActiveIdRef.current) {
      prevActiveIdRef.current = activeConversationId;
      
      if (activeConversationId) {
        const conversation = getConversation(activeConversationId);
        if (conversation && conversation.messages.length > 0) {
          // 标记正在更新，防止触发updateConversation
          isUpdatingRef.current = true;
          
          // 加载选中会话的消息
          clearMessages(conversation.messages);
          isNewConversationRef.current = false;
          
          // 异步重置更新标记
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 0);
        }
      } else {
        // 没有活动会话时，设置为新会话状态
        isNewConversationRef.current = true;
        
        // 确保新会话是完全空的
        forceEmptyMessages();
      }
    }
  }, [activeConversationId, getConversation, clearMessages]);
  
  // 当消息变化时更新当前会话 (防止循环更新)
  useEffect(() => {
    if (activeConversationId && messages.length > 0 && !isUpdatingRef.current) {
      updateConversation(activeConversationId, messages);
    }
  }, [messages, activeConversationId, updateConversation]);
  
  // 处理提交消息
  const handleSend = () => {
    if (!content.trim() || inputLoading) return;
    
    if (isNewChat) {
      setIsNewChat(false);
    }
    
    // 如果是新会话，则创建会话历史
    if (isNewConversationRef.current) {
      // 使用消息内容的前10个字符作为会话标题
      const newConversationId = addConversation(content.substring(0, 10), []);
      setActiveConversation(newConversationId);
      isNewConversationRef.current = false;
    }
    
    // 添加用户消息
    addMessage(content, 'user');
    setContent('');
    setInputLoading(true);
    
    // 简单模拟AI响应 - 直接显示完整回复，不再一个字一个字显示
    setTimeout(() => {
      // 将关联文件集成到回复消息中
      const response = {
        text: `"${content}"について\nの回答です。選択されたモデル: ${selectedModel}, モード: ${chatMode === 'mode1' ? '要望書AI' : 'LLMチャート'}`,
        // 只在mode1模式下添加文件
        files: chatMode === 'mode1' ? mockRelatedFiles : undefined
      };
      
      // 添加带有关联文件的文本消息
      addMessage(response, 'assistant');
      
      setInputLoading(false);
      
      // 回复后重新聚焦输入框
      setTimeout(() => {
        senderRef.current?.focus();
      }, 100);
    }, 500);
  };


  // 自定义角色配置
  const roles = {
    user: {
      placement: 'end' as const,
      avatar: <Avatar icon={<UserOutlined />} style={{ background: '#e6f7ff' }} />,
    },
    assistant: {
      placement: 'start' as const,
      typing: false, // 关闭打字效果，立即显示完整消息
      avatar: <Avatar icon={<RobotOutlined />} style={{ background: '#fde3cf' }} />,
      // 自定义消息渲染，集成关联文件
      messageRender: (content: any) => {
        if (typeof content === 'object' && content.text) {
          return (
            <div className="assistant-message-container">
              <div className="message-text">{content.text}</div>
              {content.files && <InlineFileList files={content.files} />}
            </div>
          );
        }
        return content;
      }
    }
  };

  // 欢迎界面
  const welcomeNode = (
    <Space direction="vertical" size={16} className="welcome-placeholder">
      <Welcome
        variant="borderless"
        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
        title="営業支援AIへようこそ"
      />
    </Space>
  );

  return (
    <div className="chat-area">
      <div className="chat-messages">
        <Bubble.List
          roles={roles}
          items={messages.length > 0 ? messages.map(msg => ({
            key: msg.id,
            content: msg.content,
            role: msg.role,
            loading: msg.loading
          })) : [{ key: 'welcome', content: welcomeNode, variant: 'borderless', role: 'system' }]}
        />
      </div>

      <div className="chat-input-area">
        <Sender
          ref={senderRef}
          value={content}
          onChange={setContent}
          loading={inputLoading}
          onSubmit={handleSend}
          placeholder="メッセージを入力してください..."
          disabled={inputLoading}
        />
      </div>
    </div>
  );
};

export default ChatArea; 