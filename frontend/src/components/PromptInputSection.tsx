import React from 'react';
import type { LLMConfig } from '../types/promptAnalyzer';

interface PromptInputSectionProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    onAnalyze: () => void;
    isLoading: boolean;
    llmConfig: LLMConfig;
    onLLMConfigChange: (config: Partial<LLMConfig>) => void;
}

const PromptInputSection: React.FC<PromptInputSectionProps> = ({
    prompt,
    setPrompt,
    onAnalyze,
    isLoading,
    llmConfig,
    onLLMConfigChange
}) => {
    return (
        <div className="prompt-section" style={{
            backgroundColor: 'var(--background-panel)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="sub-header" style={{ margin: 0 }}>✏️ Your Prompt</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        onClick={onAnalyze}
                        disabled={isLoading || !prompt.trim()}
                        style={{
                            backgroundColor: 'var(--primary-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            opacity: isLoading || !prompt.trim() ? 0.6 : 1
                        }}
                    >
                        {isLoading ? '🔍 Analyzing...' : '🔍 Analyze'}
                    </button>
                </div>
            </div>
            <textarea
                className="prompt-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={8}
            />

            {/* Quick LLM Refiner Toggle */}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={llmConfig.useLlmRefiner}
                        onChange={(e) => onLLMConfigChange({ useLlmRefiner: e.target.checked })}
                        style={{ width: 'auto' }}
                    />
                    <span>🤖 LLM Refiner</span>
                </label>
                {llmConfig.useLlmRefiner && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select
                            value={llmConfig.refinerProvider}
                            onChange={(e) => onLLMConfigChange({ refinerProvider: e.target.value })}
                            style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                            }}
                        >
                            <option value="ollama">Ollama</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="groq">Groq</option>
                        </select>
                        <input
                            type="text"
                            value={llmConfig.refinerModel}
                            onChange={(e) => onLLMConfigChange({ refinerModel: e.target.value })}
                            placeholder={llmConfig.refinerProvider === 'ollama' ? 'gemma:2b' : 'meta-llama/llama-3-8b-instruct'}
                            style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                width: '150px'
                            }}
                        />
                        {(llmConfig.refinerProvider === 'openrouter' || llmConfig.refinerProvider === 'groq') && (
                            <input
                                type="password"
                                value={llmConfig.refinerApiKey}
                                onChange={(e) => onLLMConfigChange({ refinerApiKey: e.target.value })}
                                placeholder={`Optional - uses ${llmConfig.refinerProvider.toUpperCase()}_API_KEY from .env.local`}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'var(--background-card)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    width: '200px'
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptInputSection;