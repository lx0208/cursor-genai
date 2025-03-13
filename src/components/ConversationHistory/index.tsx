import React from 'react';
import { List, Typography, Button, Empty } from 'antd';
import { DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { useConversation } from '../../contexts/ConversationContext';
import './styles.css';

const { Text, Title } = Typography;

// 获取简短标题（只取前10个字符）
const getShortTitle = (text: string): string => {
  if (!text) return '新的对话';
  if (text.length <= 10) return text;
  return text.substring(0, 10) + '...';
};

const ConversationHistory: React.FC = () => {
  const { 
    conversations, 
    activeConversationId, 
    deleteConversation,
    setActiveConversation 
  } = useConversation();

  // 按日期排序（从新到旧）
  const sortedConversations = [...conversations].sort(
    (a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()
  );

  // 处理删除会话
  const handleDeleteConversation = (id: string) => {
    deleteConversation(id);
  };

  // 处理选择会话
  const handleSelectConversation = (id: string) => {
    if (id !== activeConversationId) {
      setActiveConversation(id);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="conversation-history-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="会話履歴はありません"
        />
      </div>
    );
  }

  return (
    <div className="conversation-history">
      <Title level={4} className="conversation-history-title">会話履歴</Title>
      
      <List
        itemLayout="horizontal"
        dataSource={sortedConversations}
        renderItem={conversation => (
          <List.Item
            className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''}`}
            onClick={() => handleSelectConversation(conversation.id)}
            actions={[
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conversation.id);
                }}
                className="delete-button"
              />
            ]}
          >
            <div className="conversation-item-content">
              <div className="conversation-item-icon">
                <MessageOutlined />
              </div>
              <div className="conversation-item-info">
                <Text ellipsis strong={activeConversationId === conversation.id}>
                  {getShortTitle(conversation.title || conversation.firstMessage || '')}
                </Text>
                <Text type="secondary" className="conversation-date">
                  {conversation.lastMessageDate.toLocaleDateString()}
                </Text>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ConversationHistory; 