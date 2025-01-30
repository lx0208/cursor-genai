import streamlit as st
from typing import Optional
from auth.keycloak_auth import KeycloakAuth
from config.settings import Settings
from ui.response_handler import ResponseHandler


class StreamlitUI:
    """StreamlitのUIクラス"""
    def __init__(self, settings: Settings):
        """初期化"""
        self.settings = settings
        self.auth: Optional[KeycloakAuth] = None
        if settings.auth.get('enable'):
            self.auth = KeycloakAuth(settings.keycloak)
        self._init_page_config()

    def _init_page_config(self):
        """ページ設定の初期化"""
        st.set_page_config(
            page_title=self.settings.ui['title'],
            page_icon=":mount_fuji:",
            layout="wide"
        )

    def _setup_sidebar(self):
        """サイドバーの設定"""
        with st.sidebar:
            # タイトル表示
            st.title(self.settings.ui['title'])
            st.divider()

            # 機能選択
            functions = self.settings.get_functions()
            selected_function = st.radio(
                "機能選択",
                options=range(len(functions)),
                format_func=lambda x: functions[x].name
            )


            # ドキュメント選択
            current_function = functions[selected_function]
            st.multiselect(
                "ドキュメント",
                options=current_function.document.all,
                default=current_function.document.default
            )

            # LLMモデル選択
            st.divider()
            selected_llm = st.selectbox(
                "生成モデル",
                options=self.settings.get_llm_options()
            )
            st.session_state.selected_llm = selected_llm

            # clear chat
            if st.button("チャット履歴をクリア"):
                st.session_state.messages = []

            # ログアウトボタン
            if self.auth and self.auth.is_authenticated():
                user_info = self.auth.get_user_info()
                if user_info:
                    st.button(
                        f"ログアウト({user_info['preferred_username']})",
                        on_click=self.auth.handle_logout
                    )

    def _setup_chat_container(self):
        if "messages" not in st.session_state:
            st.session_state.messages = []
            
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                if message["role"] == "assistant":
                    self._display_assistant_message(message["content"])
                else:
                    st.write(message["content"])

        if prompt := st.chat_input("メッセージを入力してください..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.write(prompt)

            with st.chat_message("assistant"):
                self._handle_assistant_response(prompt)

    def _handle_assistant_response(self, prompt: str):
        response_handler = ResponseHandler(self.settings.get_functions())
        
        with st.spinner("考え中..."):
            response = response_handler.generate_response(prompt)
            
            if response.error:
                with st.status("エラーが発生しました", state="error"):
                    st.write(response.error)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": {"text": "", "error": response.error}
                })
                return

            with st.container(border=True):
                st.write(response.content)
                st.caption(self.settings.get_functions()[st.session_state.get('selected_function', 0)].name)
                
            current_function = response_handler.get_current_function()
            
            if current_function.source.show_enabled:
                # st.divider()
                # st.write("関連ドキュメント")
                
                for doc_name, doc_content in response.documents[:current_function.source.count]:
                    with st.expander(f"📄 {doc_name}"):
                        st.text(doc_content)
            
            st.session_state.messages.append({
                "role": "assistant",
                "content": {
                    "text": response.content,
                    "documents": response.documents[:current_function.source.count]
                }
            })

    def _display_assistant_message(self, content: dict):
        if "error" in content:
            with st.status("エラーが発生しました", state="error"):
                st.write(content["error"])
            return
            
        with st.container(border=True):
            st.write(content["text"])
            
        current_function = self.settings.get_functions()[
            st.session_state.get('selected_function', 0)
        ]
        
        if current_function.source.show_enabled and content.get("documents"):
            # st.divider()
            # st.write("関連ドキュメント")
            for doc_name, doc_content in content["documents"]:
                with st.expander(f"📄 {doc_name}"):
                    st.text(doc_content)

    def run(self):
        """アプリケーション実行"""
        if self.auth:
            self.auth.handle_callback()
            if not self.auth.is_authenticated():
                self.auth.handle_login()
                return

        self._setup_sidebar()
        self._setup_chat_container() 