import React, { useState, useEffect, useRef } from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, HistoryOutlined } from '@ant-design/icons';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import ChatArea from './components/ChatArea';
import ConversationHistory from './components/ConversationHistory';
import { LLMProvider } from './contexts/LLMContext';
import { ChatProvider } from './contexts/ChatContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { UserProvider } from './contexts/UserContext';
import './App.css';

const { Content, Sider } = Layout;

const App: React.FC = () => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  
  return (
    <UserProvider>
      <LLMProvider>
        <ChatProvider>
          <ConversationProvider>
            <Layout className="app-layout">
              <Header collapsed={leftCollapsed} setCollapsed={setLeftCollapsed} />
              <Layout className="main-layout">
                <Sider 
                  className="left-sidebar" 
                  width={250} 
                  collapsed={leftCollapsed} 
                  collapsible 
                  trigger={null}
                >
                  <LeftSidebar collapsed={leftCollapsed} />
                </Sider>
                <Content className="main-content">
                  <ChatArea />
                </Content>
                <Sider 
                  className="right-sidebar" 
                  width={280} 
                  collapsedWidth={0}
                  trigger={null}
                  collapsible
                  collapsed={rightCollapsed}
                  reverseArrow
                >
                  <ConversationHistory />
                </Sider>
                <Button
                  type="text"
                  icon={rightCollapsed ? <HistoryOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setRightCollapsed(!rightCollapsed)}
                  className="right-sidebar-trigger"
                  title={rightCollapsed ? "显示会话历史" : "隐藏会话历史"}
                />
              </Layout>
            </Layout>
          </ConversationProvider>
        </ChatProvider>
      </LLMProvider>
    </UserProvider>
  );
};

export default App;