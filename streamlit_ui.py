import streamlit as st
import yaml
from keycloak import KeycloakGetError, KeycloakOpenID
from typing import Optional
import time

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class StreamlitChatUI:
    def __init__(self, config_path: str = "config.yaml"):
        self.config = self._load_config(config_path)
        self.keycloak_client = self._init_keycloak()
        self.available_models = {
            "Gemini": ["gemini-pro", "gemini-pro-vision"],
            "Cohere": ["command", "command-light", "command-nightly"]
        }
        
    def _load_config(self, config_path: str) -> dict:
        """加载配置文件"""
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
    
    def _init_keycloak(self) -> KeycloakOpenID:
        """初始化Keycloak客户端"""
        return KeycloakOpenID(
            server_url=self.config['keycloak']['server_url'],
            client_id=self.config['keycloak']['client_id'],
            realm_name=self.config['keycloak']['realm'],
            client_secret_key=self.config['keycloak']['client_secret'],
            verify=False
        )
    
    def _check_auth(self) -> bool:
        """检查用户是否已认证"""
        return 'token_info' in st.session_state
    
    def _handle_login(self):
        """处理登录流程"""
        auth_url = self.keycloak_client.auth_url(
            redirect_uri=self.config['keycloak']['redirect_uri']
        )
        print(f"auth_url: {auth_url}")
        
        # 加载外部 CSS 文件
        with open('static/styles.css') as f:
            st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
        
        # 创建登录按钮
        st.markdown(
            f"""
            <div class="login-container">
                <a href="{auth_url}" class="login-btn">ZM Login</a>
            </div>
            """,
            unsafe_allow_html=True
        )
    
    def _handle_callback(self):
        """处理OAuth回调"""
        if 'code' in st.query_params:
            code = st.query_params['code']
            token = self.keycloak_client.token(
                grant_type='authorization_code',
                code=code,
                redirect_uri=self.config['keycloak']['redirect_uri']
            )
            st.session_state.token_info = token
            st.rerun()
    
    def _init_chat_history(self):
        """初始化聊天历史"""
        if 'messages' not in st.session_state:
            st.session_state.messages = []
    
    def _display_chat_messages(self):
        """显示聊天消息"""
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
    
    def _handle_chat_input(self):
        """处理聊天输入"""
        if prompt := st.chat_input("请输入您的问题"):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            
            # 这里添加AI响应逻辑
            with st.chat_message("assistant"):
                response = f"这是对 '{prompt}' 的模拟回复"
                st.markdown(response)
                st.session_state.messages.append({"role": "assistant", "content": response})
    
    def _get_user_info(self):
        """获取用户信息"""
        if 'token_info' in st.session_state:
            try:
                access_token = st.session_state.token_info['access_token']
                userinfo = self.keycloak_client.userinfo(access_token)
                return userinfo
            except KeycloakGetError as e:
                raise KeycloakGetError(f"Get user info permission denied. {e}")
                
    def _setup_sidebar(self):
        """设置侧边栏"""
        with st.sidebar:
            st.title("模型选择")
            
            # 选择 LLM 提供商
            provider = st.selectbox(
                "选择 LLM 提供商",
                options=list(self.available_models.keys())
            )
            
            # 根据提供商选择具体模型
            model = st.selectbox(
                "选择模型",
                options=self.available_models[provider]
            )
            
            if 'selected_model' not in st.session_state or st.session_state.selected_model != model:
                st.session_state.selected_model = model

    def run(self):
        """运行Streamlit UI"""
        if not self._check_auth():
            # 清除默认的页面内容
            st.set_page_config(
                page_title="ZM Login",
                page_icon="🔒",
                layout="centered"
            )
            # 隐藏默认的 Streamlit 样式
            st.markdown("""
                <style>
                    #MainMenu {visibility: hidden;}
                    footer {visibility: hidden;}
                    .stDeployButton {display:none;}
                    header {visibility: hidden;}
                </style>
                """, unsafe_allow_html=True)
            
            self._handle_login()
            self._handle_callback()
            return
        
        # 获取用户信息并显示在右上角
        user_info = self._get_user_info()
        print(f"user_info: {user_info}")
        if user_info:
            st.markdown(
                f"""
                <div style="position: fixed; right: 20px; top: 20px; z-index: 1000; 
                background-color: #f0f2f6; padding: 10px; border-radius: 5px;">
                    👤 {user_info.get('name', 'User')}
                </div>
                """,
                unsafe_allow_html=True
            )
        
        st.title("RAG - Retrieval Augmented Generation")
        
        # 设置侧边栏
        self._setup_sidebar()
        
        self._init_chat_history()
        self._display_chat_messages()
        self._handle_chat_input() 