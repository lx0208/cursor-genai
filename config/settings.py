from dataclasses import dataclass
from typing import List, Optional
import yaml

@dataclass
class LLMConfig:
    """LLMの設定クラス"""
    type: str
    model: str

@dataclass
class DocumentConfig:
    """ドキュメント設定クラス"""
    default: List[str]
    all: List[str]

@dataclass
class SourceConfig:
    """ソース設定クラス"""
    count: int
    show_enabled: bool

@dataclass
class FunctionConfig:
    """機能設定クラス"""
    name: str
    source: SourceConfig
    document: DocumentConfig

@dataclass
class KeycloakConfig:
    """Keycloak設定クラス"""
    server_url: str
    client_id: str
    client_secret: str
    realm: str
    redirect_uri: str

@dataclass
class Settings:
    """アプリケーション設定クラス"""
    server: dict
    ui: dict
    auth: dict
    keycloak: Optional[KeycloakConfig] = None

    @classmethod
    def load(cls, config_path: str) -> 'Settings':
        """設定ファイルを読み込む"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                
            # Keycloak設定の変換
            keycloak_config = None
            if config.get('auth', {}).get('enable'):
                keycloak_config = KeycloakConfig(**config['keycloak'])

            return cls(
                server=config['server'],
                ui=config['ui'],
                auth=config['auth'],
                keycloak=keycloak_config
            )
        except Exception as e:
            raise ValueError(f"設定ファイルの読み込みエラー: {str(e)}")

    def get_llm_options(self) -> List[str]:
        """LLMオプションを取得"""
        return [f"{llm['model']} ({llm['type']})" for llm in self.ui['llms']]

    def get_functions(self) -> List[FunctionConfig]:
        """機能一覧を取得"""
        return [FunctionConfig(
            name=func['name'],
            source=SourceConfig(**func['source']),
            document=DocumentConfig(**func['document'])
        ) for func in self.ui['functions']] 