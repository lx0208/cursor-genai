from typing import Optional, Dict
import streamlit as st
from keycloak import KeycloakOpenID, KeycloakGetError
from config.settings import KeycloakConfig

class KeycloakAuth:
    """Keycloak認証クラス"""
    def __init__(self, config: KeycloakConfig):
        """初期化"""
        self.config = config
        self.client = self._init_client()

    def _init_client(self) -> KeycloakOpenID:
        """Keycloakクライアントの初期化"""
        try:
            return KeycloakOpenID(
                server_url=self.config.server_url,
                client_id=self.config.client_id,
                realm_name=self.config.realm,
                client_secret_key=self.config.client_secret,
                verify=False
            )
        except Exception as e:
            raise Exception(f"Keycloakクライアントの初期化エラー: {str(e)}")

    def is_authenticated(self) -> bool:
        """認証状態チェック"""
        return 'token_info' in st.session_state

    def handle_login(self):
        """ログイン処理"""
        try:
            auth_url = self.client.auth_url(
                redirect_uri=self.config.redirect_uri,
                scope="profile openid email"
            )
            st.link_button("ログイン", auth_url, icon="🔑", use_container_width=True)
        except Exception as e:
            st.error(f"ログインエラー: {str(e)}")

    def handle_logout(self):
        """ログアウト処理"""
        try:
            if 'token_info' in st.session_state:
                self.client.logout(
                    refresh_token=st.session_state.token_info['refresh_token']
                )
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
        except Exception as e:
            st.error(f"ログアウトエラー: {str(e)}")

    def handle_callback(self):
        """コールバック処理"""
        if 'code' in st.query_params:
            try:
                code = st.query_params['code']
                token = self.client.token(
                    grant_type='authorization_code',
                    code=code,
                    redirect_uri=self.config.redirect_uri
                )
                st.session_state.token_info = token
                st.query_params.clear()
                st.rerun()
            except Exception as e:
                st.error(f"認証エラー: {str(e)}")

    def get_user_info(self) -> Optional[Dict]:
        """ユーザー情報取得"""
        if 'token_info' in st.session_state:
            try:
                access_token = st.session_state.token_info['access_token']
                return self.client.userinfo(access_token)
            except KeycloakGetError as e:
                raise KeycloakGetError(f"ユーザー情報取得エラー: {str(e)}")
        return None 