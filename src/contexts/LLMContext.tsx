import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ChatMode = 'mode1' | 'mode2';

export interface LLMContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  modelOptions: { value: string; label: string }[];
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export const LLMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<string>('cohere-r-plus');
  const [chatMode, setChatMode] = useState<ChatMode>('mode1');
  
  const modelOptions = [
    { value: 'cohere', label: 'cohere' },
    { value: 'cohere-r-plus', label: 'cohere-r-plus' },
  ];

  return (
    <LLMContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        chatMode,
        setChatMode,
        modelOptions,
      }}
    >
      {children}
    </LLMContext.Provider>
  );
};

export const useLLM = (): LLMContextType => {
  const context = useContext(LLMContext);
  if (context === undefined) {
    throw new Error('useLLM must be used within a LLMProvider');
  }
  return context;
}; 