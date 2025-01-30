from dataclasses import dataclass
from typing import List, Optional, Tuple
import streamlit as st
from config.settings import FunctionConfig

@dataclass
class ResponseData:
    content: str
    documents: List[Tuple[str, str]]
    error: Optional[str] = None

class ResponseHandler:
    def __init__(self, functions: List[FunctionConfig]):
        self.functions = functions
        
    def get_current_function(self) -> FunctionConfig:
        return self.functions[st.session_state.get('selected_function', 0)]

    def generate_response(self, prompt: str) -> ResponseData:
        try:
            content = """
            ■背景・目的  
            ■前提・制約事項  
            ■要件  
            ◆カテゴリ1：
            ◆カテゴリ2：
            """
            
            documents = [
                ("電子交付対応_xxxx.csv", "文档内容1"),
                ("電子交付対応_yyyy.csv", "文档内容2"),
                ("電子交付対応_zzzz.csv", "文档内容3"),
            ]
            
            return ResponseData(content=content, documents=documents)
            
        except Exception as e:
            return ResponseData(
                content="",
                documents=[],
                error=f"answer error: {str(e)}"
            ) 