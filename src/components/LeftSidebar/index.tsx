import React, { useState, useRef } from 'react';
import { Layout, Menu, Select, Radio, Button, Divider, Tag, Typography } from 'antd';
import { PlusOutlined, MessageOutlined, SettingOutlined, FileTextOutlined, RobotOutlined } from '@ant-design/icons';
import { useLLM, ChatMode } from '../../contexts/LLMContext';
import { useChat } from '../../contexts/ChatContext';
import { useConversation } from '../../contexts/ConversationContext';
import './styles.css';

const { Sider } = Layout;
const { Text } = Typography;

interface LeftSidebarProps {
  collapsed: boolean;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ collapsed }) => {
  const { selectedModel, setSelectedModel, chatMode, setChatMode, modelOptions } = useLLM();
  const { clearMessages, setIsNewChat } = useChat();
  const { setActiveConversation } = useConversation();
  const [selectedDocType, setSelectedDocType] = useState<string>('requirement');
  
  // 防止更新循环的标记
  const isUpdatingRef = useRef<boolean>(false);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleModeChange = (e: any) => {
    // 获取新模式
    const newMode = e.target.value as ChatMode;
    
    // 如果模式不同，则创建新会话
    if (newMode !== chatMode) {
      // 标记为更新中，防止触发更新会话效果
      isUpdatingRef.current = true;
      
      // 设置新模式
      setChatMode(newMode);
      
      // 清空当前消息，创建新会话
      clearMessages([]);
      setIsNewChat(true);
      setActiveConversation(null);
      
      // 异步重置更新标记
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const handleNewChat = () => {
    // 标记为更新中，防止触发更新会话效果
    isUpdatingRef.current = true;
    
    // 确保完全清空所有消息
    clearMessages([]);
    setIsNewChat(true);
    setActiveConversation(null);
    
    // 异步重置更新标记
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  };

  const handleDocTypeChange = (value: string) => {
    setSelectedDocType(value);
  };

  // 渲染特定模式下的菜单项
  const renderModeSpecificOptions = () => {
    if (chatMode === 'mode1') { // 要望書AI模式
      return (
        <>
          <Divider className="divider" />
          <div className="section-title">プロンプト選択</div>
          <Select
            defaultValue="要望書プロンプト"
            disabled
            style={{ width: '100%' }}
            options={[
              { value: 'requirement', label: '要望書プロンプト', icon: <FileTextOutlined /> }
            ]}
           
          />
          <Divider className="divider" />
          <div className="section-title">ドキュメント</div>
          <div className="document-tags">
            <Tag color="magenta">要望書</Tag>
          </div>
        </>
      );
    } 
    return null;
  };

  return (
    <Sider
      className="left-sidebar"
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={260}
      collapsedWidth={80}
    >
      <div className="sidebar-content">
        <div className="new-chat-button-container">
          <Button 
            type="primary" 
            className="new-chat-button" 
            icon={<PlusOutlined />}
            onClick={handleNewChat}
          >
            {!collapsed && '新しいチャット'}
          </Button>
        </div>

        {!collapsed && (
          <div className="settings-section">
            <div className="section-title">モデル選択</div>
            <Select
              value={selectedModel}
              onChange={handleModelChange}
              options={modelOptions}
              className="model-select"
              placeholder="AIモデルを選択"
            />

            <Divider className="divider" />

            <div className="section-title">チャットモード</div>
            <Radio.Group 
              onChange={handleModeChange} 
              value={chatMode}
              className="mode-radio"
              options={[
                { value: 'mode1', label: '要望書AI' },
                { value: 'mode2', label: 'LLMチャート' },
              ]}
            />
            
            {renderModeSpecificOptions()}
          </div>
        )}
      </div>
    </Sider>
  );
};

export default LeftSidebar; 