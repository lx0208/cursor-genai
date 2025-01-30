import streamlit as st
from config.settings import Settings
from ui.streamlit_ui import StreamlitUI

import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def main():
    """メイン関数"""
    # 設定読み込み
    settings = Settings.load("settings.yaml")
        
    # UIの初期化と実行
    ui = StreamlitUI(settings)
    ui.run()


if __name__ == "__main__":
    main()
