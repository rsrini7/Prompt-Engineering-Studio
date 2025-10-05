import React, { useState } from 'react';
import type { LLMConfig } from '../types/promptAnalyzer';

interface ABTestResult {
    summary: {
        total_examples: number;
        successful_evaluations: number;
        prompt_a_avg_score: number;
        prompt_b_avg_score: number;
        prompt_a_wins: number;
        prompt_b_wins: number;
        ties: number;
        winner: string;
        winning_margin: number;
    };
    detailed_results: Array<{
        question: string;
        expected_answer: string;
        prompt_a_answer: string;
        prompt_b_answer: string;
        prompt_a_score: number;
        prompt_b_score: number;
        error?: string;
    }>;
    configuration: {
        metric: string;
        provider: string;
        model: string;
    };
}

interface ABTestingViewProps {
    llmConfig: LLMConfig;
    onLLMConfigChange: (config: Partial<LLMConfig>) => void;
}

const ABTestingView: React.FC<ABTestingViewProps> = ({
    llmConfig,
    onLLMConfigChange
}) => {
    const [promptA, setPromptA] = useState('Answer the following question.');
    const [promptB, setPromptB] = useState('Provide a comprehensive answer to the question.');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedMetric, setSelectedMetric] = useState('exact_match');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<ABTestResult | null>(null);
    const [error, setError] = useState('');

    const currentProvider = llmConfig.useLlmRefiner ? llmConfig.refinerProvider : 'ollama';
    const currentModel = llmConfig.useLlmRefiner ? llmConfig.refinerModel : 'gemma:2b';
    const currentApiKey = llmConfig.useLlmRefiner ? llmConfig.refinerApiKey : '';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const runABTest = async () => {
        if (!selectedFile || !promptA.trim() || !promptB.trim()) {
            setError('Please provide both prompts and select a dataset file.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('prompt_a', promptA);
            formData.append('prompt_b', promptB);
            formData.append('dataset', selectedFile);
            formData.append('provider', currentProvider);
            formData.append('model', currentModel);
            formData.append('api_key', currentApiKey);
            formData.append('metric', selectedMetric);

            const response = await fetch('http://localhost:8000/api/evaluate/ab_test', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError(`A/B test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            padding: '2rem',
            backgroundColor: 'var(--background-panel)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem'
        }}>
            <h2 style={{
                color: 'var(--primary-accent)',
                fontSize: '1.8rem',
                fontWeight: '700',
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
            }}>
                <span>⚖️</span>
                A/B Testing Framework
            </h2>

            {/* Configuration Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                {/* Prompt A */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--primary-accent)'
                    }}>
                        Prompt A:
                    </label>
                    <textarea
                        value={promptA}
                        onChange={(e) => setPromptA(e.target.value)}
                        placeholder="Enter the first prompt to test..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '1rem',
                            backgroundColor: 'var(--background-card)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Prompt B */}
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: 'var(--primary-accent)'
                    }}>
                        Prompt B:
                    </label>
                    <textarea
                        value={promptB}
                        onChange={(e) => setPromptB(e.target.value)}
                        placeholder="Enter the second prompt to test..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '1rem',
                            backgroundColor: 'var(--background-card)',
                            color: 'var(--text-primary)',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Controls Section */}
            <div style={{
                backgroundColor: 'var(--background-dark)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '2rem'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'start',
                    marginBottom: '1rem',
                    minHeight: '120px'
                }}>
                    {/* File Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', justifyContent: 'space-between' }}>
                        <label style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            Dataset File:
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".csv,.jsonl"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                flex: '1'
                            }}
                        />
                        {selectedFile && (
                            <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--primary-accent)',
                                textAlign: 'center'
                            }}>
                                ✅ {selectedFile.name}
                            </div>
                        )}
                    </div>

                    {/* Metric Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', justifyContent: 'space-between' }}>
                        <label style={{
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            Evaluation Metric:
                        </label>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                flex: '1'
                            }}
                        >
                            <option value="exact_match">Exact Match</option>
                            <option value="llm_as_a_judge">LLM Judge (Quality)</option>
                        </select>
                    </div>

                    {/* LLM Configuration */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        height: '100%',
                        justifyContent: 'space-between'
                    }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.25rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            Provider:
                        </label>
                        <select
                            value={llmConfig.useLlmRefiner ? 'refiner' : 'default'}
                            onChange={(e) => {
                                if (e.target.value === 'refiner') {
                                    onLLMConfigChange({ useLlmRefiner: true });
                                } else {
                                    onLLMConfigChange({ useLlmRefiner: false });
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                flex: '0 0 auto'
                            }}
                        >
                            <option value="default">Ollama (Local)</option>
                            <option value="refiner">Custom Configuration</option>
                        </select>

                        {llmConfig.useLlmRefiner && (
                            <>
                                <input
                                    type="text"
                                    value={llmConfig.refinerProvider}
                                    onChange={(e) => onLLMConfigChange({ refinerProvider: e.target.value })}
                                    placeholder="Provider (ollama, openrouter, groq)"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--background-card)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        flex: '1'
                                    }}
                                />
                                <input
                                    type="text"
                                    value={llmConfig.refinerModel}
                                    onChange={(e) => onLLMConfigChange({ refinerModel: e.target.value })}
                                    placeholder="Model name (e.g., gemma:2b)"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--background-card)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        flex: '1'
                                    }}
                                />
                                <input
                                    type="password"
                                    value={llmConfig.refinerApiKey}
                                    onChange={(e) => onLLMConfigChange({ refinerApiKey: e.target.value })}
                                    placeholder="API Key (if required)"
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        backgroundColor: 'var(--background-card)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        flex: '1'
                                    }}
                                />
                            </>
                        )}

                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            marginTop: 'auto',
                            fontStyle: 'italic',
                            paddingTop: '0.25rem',
                            textAlign: 'center'
                        }}>
                            Current: {currentProvider} | {currentModel}
                        </div>
                    </div>

                    {/* Run Test Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                        <button
                            onClick={runABTest}
                            disabled={isLoading || !selectedFile || !promptA.trim() || !promptB.trim()}
                            style={{
                                backgroundColor: (isLoading || !selectedFile || !promptA.trim() || !promptB.trim())
                                    ? 'var(--border-color)'
                                    : 'var(--primary-accent)',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: (isLoading || !selectedFile || !promptA.trim() || !promptB.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (isLoading || !selectedFile || !promptA.trim() || !promptB.trim()) ? 0.6 : 1,
                                transition: 'all 0.2s ease',
                                height: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isLoading ? '🔄 Running Test...' : '⚖️ Run A/B Test'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{
                        color: 'var(--error-color)',
                        backgroundColor: 'rgba(255, 85, 85, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--error-color)',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}
            </div>

            {/* Results Section */}
            {results && (
                <div style={{
                    backgroundColor: 'var(--background-dark)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden'
                }}>
                    {/* Summary Section */}
                    <div style={{
                        backgroundColor: 'var(--background-card)',
                        padding: '1.5rem',
                        borderBottom: '2px solid var(--border-color)'
                    }}>
                        <h3 style={{
                            color: 'var(--primary-accent)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            textAlign: 'center'
                        }}>
                            📊 Test Results Summary
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{
                                backgroundColor: 'var(--background-panel)',
                                padding: '1rem',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Total Examples
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: 'var(--primary-accent)'
                                }}>
                                    {results.summary.total_examples}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'var(--background-panel)',
                                padding: '1rem',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Prompt A Score
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: results.summary.winner === 'Prompt A' ? 'var(--primary-accent)' : 'var(--text-secondary)'
                                }}>
                                    {results.summary.prompt_a_avg_score.toFixed(3)}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'var(--background-panel)',
                                padding: '1rem',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    Prompt B Score
                                </div>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: results.summary.winner === 'Prompt B' ? 'var(--primary-accent)' : 'var(--text-secondary)'
                                }}>
                                    {results.summary.prompt_b_avg_score.toFixed(3)}
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: 'var(--background-panel)',
                                padding: '1rem',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.5rem'
                                }}>
                                🏆 Winner
                                </div>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '700',
                                    color: 'var(--primary-accent)'
                                }}>
                                    {results.summary.winner}
                                </div>
                            </div>
                        </div>

                        {/* Win/Loss/Tie Breakdown */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '1rem',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    Prompt A Wins
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: 'var(--primary-accent)'
                                }}>
                                    {results.summary.prompt_a_wins}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    Ties
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {results.summary.ties}
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    Prompt B Wins
                                </div>
                                <div style={{
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    color: 'var(--primary-accent)'
                                }}>
                                    {results.summary.prompt_b_wins}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Results Table */}
                    <div style={{
                        padding: '1.5rem',
                        maxHeight: '500px',
                        overflowY: 'auto'
                    }}>
                        <h4 style={{
                            color: 'var(--primary-accent)',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            marginBottom: '1rem'
                        }}>
                            📋 Detailed Results
                        </h4>

                        <div style={{
                            display: 'grid',
                            gap: '1rem'
                        }}>
                            {results.detailed_results.map((result, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: 'var(--background-panel)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr auto',
                                        gap: '1rem',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            Question:
                                        </div>
                                        <div style={{
                                            fontSize: '0.9rem',
                                            fontWeight: '500'
                                        }}>
                                            {result.question}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            Expected:
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {result.expected_answer}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            Scores:
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                color: result.prompt_a_score > result.prompt_b_score ? 'var(--primary-accent)' : 'var(--text-secondary)'
                                            }}>
                                                A: {result.prompt_a_score.toFixed(2)}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>|</span>
                                            <span style={{
                                                color: result.prompt_b_score > result.prompt_a_score ? 'var(--primary-accent)' : 'var(--text-secondary)'
                                            }}>
                                                B: {result.prompt_b_score.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        backgroundColor: result.prompt_a_score > result.prompt_b_score
                                            ? 'rgba(13, 142, 255, 0.2)'
                                            : result.prompt_b_score > result.prompt_a_score
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(156, 163, 175, 0.2)',
                                        padding: '0.5rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        minWidth: '80px'
                                    }}>
                                        {result.prompt_a_score > result.prompt_b_score ? 'A Wins' :
                                         result.prompt_b_score > result.prompt_a_score ? 'B Wins' : 'Tie'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ABTestingView;