import React, { useState } from 'react';
import { Layout, Button, Dropdown, Avatar, Modal, Form, Input } from 'antd';
import { UserOutlined, LogoutOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useUser } from '../../contexts/UserContext';
import './styles.css';

const { Header } = Layout;

interface HeaderComponentProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const HeaderComponent: React.FC<HeaderComponentProps> = ({ collapsed, setCollapsed }) => {
  const { user, login, logout, isLoggedIn } = useUser();
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [form] = Form.useForm();

  const showLoginModal = () => {
    setIsLoginModalVisible(true);
  };

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      login(values.username);
      setIsLoginModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleCancel = () => {
    setIsLoginModalVisible(false);
    form.resetFields();
  };

  const items = [
    {
      key: 'logout',
      label: (
        <div onClick={logout} className="dropdown-item">
          <LogoutOutlined /> <span>ログアウト</span>
        </div>
      ),
    },
  ];

  return (
    <Header className="app-header">
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="trigger-button"
        />
        <div className="logo">営業AI</div>
      </div>
      <div className="header-right">
        {isLoggedIn ? (
          <Dropdown menu={{ items }} placement="bottomRight" arrow>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <Avatar className="avatar" icon={<UserOutlined />}>
                {user?.avatar}
              </Avatar>
            </div>
          </Dropdown>
        ) : (
          <Button type="primary" onClick={showLoginModal}>
            ログイン
          </Button>
        )}
      </div>

      <Modal
        title="ログイン"
        open={isLoginModalVisible}
        onOk={handleLogin}
        onCancel={handleCancel}
        okText="ログイン"
        cancelText="キャンセル"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="ユーザー名"
            rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="ユーザー名を入力" />
          </Form.Item>
          <Form.Item
            name="password"
            label="パスワード"
            rules={[{ required: true, message: 'パスワードを入力してください' }]}
          >
            <Input.Password placeholder="パスワードを入力" />
          </Form.Item>
        </Form>
      </Modal>
    </Header>
  );
};

export default HeaderComponent; 