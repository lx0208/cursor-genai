import random
import streamlit as st
import yaml
from keycloak import KeycloakGetError, KeycloakOpenID
from typing import Optional
import time
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class StreamlitChatUI:
    def __init__(self, config_path: str = "config.yaml"):
        self._init_page_config()
        self.config = self._load_config(config_path)
        self.keycloak_client = self._init_keycloak()
        self.available_models = ["gemini-pro", "command"]
        self.function_mapping = self._load_function_mapping()
        
    def _load_config(self, config_path: str) -> dict:
        """加载配置文件"""
        with open(config_path, 'r') as file:
            return yaml.safe_load(file)
        
    def _init_page_config(self):
        st.set_page_config(
            page_title="RAGAI",
            page_icon=":mount_fuji:",
            layout="centered"
        )    
    
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
        return 'token_info' in st.session_state

    def _handle_login(self):
        """ログインプロセスを処理する"""
        auth_url = self.keycloak_client.auth_url(
            redirect_uri=self.config['keycloak']['redirect_uri'],
            scope="profile openid email"
        )
        st.link_button("Aslead Login", auth_url, icon="🔑", use_container_width=True)
        
    def _handle_logout(self):
        """ログアウト処理"""
        try:
            if 'token_info' in st.session_state:
                # セッションをクリア
                self.keycloak_client.logout(
                    refresh_token=st.session_state.token_info['refresh_token']
                )
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
        except Exception as e:
            st.error(f"ログアウトエラー: {str(e)}")

    def _handle_callback(self):
        """处理OAuth回调"""
        if 'code' in st.query_params:
            try:
                code = st.query_params['code']
                token = self.keycloak_client.token(
                    grant_type='authorization_code',
                    code=code,
                    redirect_uri=self.config['keycloak']['redirect_uri']
                )
                st.session_state.token_info = token
                st.query_params.clear()
                st.rerun()
            except Exception as e:
                st.error(f"認証エラー: {str(e)}")
                return

    def _setup_chat_container(self):
        """チャットコンテナの初期化"""
        if "messages" not in st.session_state.keys():
            st.session_state.messages = [{"role": "assistant", "content": "How may I assist you today?"}]
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.write(message["content"])
        if prompt := st.chat_input():
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.write(prompt)
        if st.session_state.messages[-1]["role"] != "assistant":
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = self._generate_response(prompt)
                    with st.container(border=True):
                        st.write(response)
                        st.caption(st.session_state.selected_function)
                message = {"role": "assistant", "content": response}
                st.session_state.messages.append(message)

    def _generate_response(self, prompt_input):
        output = """
            ■背景・目的  
            ■前提・制約事項  
            ■要件  
            ◆カテゴリ1：
            ◆カテゴリ2：
            """
        docs = ["電子交付対応_xxxx.csv", "電子交付対応_xxxx.csv", "電子交付対応_xxxx.csv", "電子交付対応_xxxx.csv", "電子交付対応_xxxx.csv"]
        if len(docs) > 0:
            mk_docs = "  \n".join([f"📃:blue[{doc}]" for doc in docs])
            # st.write("関係ドキュメント")
            # st.markdown(mk_docs)
        return output

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
        """サイドバーの設定"""
        with st.sidebar:
            gradient_text_html = """
                <style>
                .gradient-text {
                    font-weight: bold;
                    background: -webkit-linear-gradient(left, #2E4B73, #4A90E2);
                    background: linear-gradient(to right, #2E4B73, #4A90E2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    display: inline;
                    font-size: 2em;
                }
                </style>
                <span class="gradient-text">RAG生成AI</span>
                """
            st.markdown(gradient_text_html, unsafe_allow_html=True)
            st.divider()

            # 機能選択
            selected_function = st.radio(
                "機能選択",
                options=list(self.function_mapping.keys()),
                format_func=lambda x: self.function_mapping[x]["name"]
            )
            st.session_state.selected_function = selected_function

            # ドキュメント選択の自動更新
            default_docs = self.function_mapping[selected_function]["documents"]
            all_docs = [doc for func in self.function_mapping.values() for doc in func["documents"]]

            colors = ["blue", "green", "orange", "red"]
            colored_docs = []
            for doc in default_docs:
                color = random.choice(colors)  # 随机选择一个颜色
                colored_doc = f':{color}-background[:bookmark:{doc}]'
                colored_docs.append(colored_doc)
            
            # 将结果用 markdown 显示
            with st.container(border=True):
                st.markdown(f'<span style="font-size: 0.85em;">{" ".join(colored_docs)}</span>', unsafe_allow_html=True)
                st.caption(f'<span style="font-size: 0.8em;">関連ドキュメント</span>', unsafe_allow_html=True)

            # モデル選択
            st.divider()

            model = st.selectbox(
                "生成モデル",
                options=self.available_models
            )

            # user logout
            user_info = self._get_user_info()
            if user_info:
                st.button(f"ログアウト({user_info['preferred_username']})",icon=":material/logout:", on_click=self._handle_logout)

    def _display_user_menu(self, user_info):
        """ユーザーメニューを表示"""
        

    def _display_related_docs(self, docs):
        """関連ドキュメントを表示"""
        if docs:
            st.markdown("""
                <div class="related-docs-header">
                    <span class="related-docs-icon">📚</span>
                    <span class="related-docs-title">関連ドキュメント</span>
                </div>
                """, unsafe_allow_html=True)
            
            for doc in docs:
                st.markdown(f"""
                    <div class="doc-item">
                        <span class="doc-icon">📄</span>
                        <span class="doc-name">{doc}</span>
                    </div>
                    """, unsafe_allow_html=True)

    def _load_function_mapping(self):
        """機能とドキュメントのマッピングを読み込む"""
        with open('static/function_docs_mapping.json', 'r', encoding='utf-8') as f:
            return json.load(f)


    def run(self):
        """メインのUIを実行"""
        # 認証コードの処理
        self._handle_callback()
        # 未ログインの場合
        if not self._check_auth():
            self._handle_login()
            return  
        # ログイン済みの場合
        self._setup_sidebar()
        self._setup_chat_container()
