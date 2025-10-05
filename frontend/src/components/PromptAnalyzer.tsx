import { useState, useEffect } from 'react';
import axios from 'axios';

// --- Type definitions ---
interface Pattern {
    pattern: string;
    confidence: number;
    evidence: string[];
    description: string;
    category: string;
}

interface AnalysisResponse {
    patterns: Record<string, Pattern>;
}

interface TemplateSuggestion {
    name: string;
    score: number;
}

interface OptimizationResult {
    original_prompt: string;
    optimized_prompt: string;
}

const PromptAnalyzer = () => {
    // --- State variables ---
    const [prompt, setPrompt] = useState<string>("Answer the following question.");
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // --- State for the optimization feature ---
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [optimizationStatus, setOptimizationStatus] = useState<'idle' | 'optimizing' | 'success' | 'error'>('idle');
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
    const [optimizationError, setOptimizationError] = useState<string>('');

    // --- State for LLM refiner ---
    const [useLlmRefiner, setUseLlmRefiner] = useState<boolean>(false);
    const [refinerProvider, setRefinerProvider] = useState<string>('ollama');
    const [refinerModel, setRefinerModel] = useState<string>('gemma:2b');
    const [refinerApiKey, setRefinerApiKey] = useState<string>('');

    // --- State for optimization ---
    const [provider, setProvider] = useState<string>('ollama');
    const [model, setModel] = useState<string>('gemma:2b');
    const [apiKey, setApiKey] = useState<string>('');
    const [metric, setMetric] = useState<string>('exact_match');
    const [maxIterations, setMaxIterations] = useState<number>(4);

    // --- State for cost estimation ---
    const [costEstimation, setCostEstimation] = useState<any>(null);
    const [showCostEstimation, setShowCostEstimation] = useState<boolean>(false);

    // Manual pattern analysis trigger
    const handleAnalyzeClick = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt first.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestions([]);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('use_llm_refiner', useLlmRefiner.toString());
            formData.append('llm_provider', refinerProvider);
            formData.append('llm_model', refinerModel);
            formData.append('llm_api_key', refinerApiKey);

            const response = await axios.post<AnalysisResponse>('http://127.0.0.1:8000/api/analyze', formData);
            const analysisResults = response.data;
            setResults(analysisResults);

            if (analysisResults && Object.keys(analysisResults.patterns).length > 0) {
                const suggestionResponse = await axios.post('http://127.0.0.1:8000/api/templates/suggest', analysisResults);
                setSuggestions(suggestionResponse.data.suggestions);
            }
        } catch (err) {
            setError('Failed to fetch data. Make sure the backend is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear results when LLM refiner settings change
    useEffect(() => {
        if (useLlmRefiner) {
            setResults(null);
            setSuggestions([]);
            setError('');
        }
    }, [useLlmRefiner, refinerProvider, refinerModel, refinerApiKey]);

    // Handler function for the optimize button
    const handleOptimizeClick = async () => {
        // Reset previous errors on each new attempt
        setOptimizationError('');
        setOptimizationResult(null);
        setOptimizationStatus('idle');

        // --- VALIDATION CHECKS ---
        if (!selectedFile) {
            setOptimizationError("Please select a dataset file first.");
            setOptimizationStatus('error'); // This line was missing
            return;
        }
        if (!model.trim()) {
            setOptimizationError("Please enter a model name.");
            setOptimizationStatus('error'); // This line was missing
            return;
        }
        if ((provider === 'openrouter' || provider === 'groq') && !apiKey.trim()) {
            setOptimizationError(`Please enter an API key for ${provider}.`);
            setOptimizationStatus('error'); // This line was missing
            return;
        }

        // Handle cost estimation first
        if (showCostEstimation && selectedFile) {
            try {
                const estimationFormData = new FormData();
                estimationFormData.append('dataset', selectedFile);
                estimationFormData.append('provider', provider);
                estimationFormData.append('model', model);
                estimationFormData.append('max_iterations', maxIterations.toString());

                const estimationResponse = await axios.post('http://127.0.0.1:8000/api/optimize/estimate', estimationFormData);
                setCostEstimation(estimationResponse.data);

                // Ask for confirmation if cost is significant
                if (estimationResponse.data.total_cost_usd > 0.01) {
                    const confirmed = window.confirm(
                        `Estimated cost: $${estimationResponse.data.total_cost_usd.toFixed(4)}. Continue with optimization?`
                    );
                    if (!confirmed) {
                        setOptimizationStatus('idle');
                        return;
                    }
                }
            } catch (err) {
                console.error('Cost estimation failed:', err);
                // Continue with optimization even if estimation fails
            }
        }

        setOptimizationStatus('optimizing');
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('dataset', selectedFile);
        formData.append('provider', provider);
        formData.append('model', model);
        formData.append('api_key', apiKey);
        formData.append('metric', metric);
        formData.append('max_iterations', maxIterations.toString());


        try {
            const response = await axios.post<OptimizationResult>('http://127.0.0.1:8000/api/optimize', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Optimization response received:", response.data); 

            setOptimizationResult(response.data);
            setOptimizationStatus('success');
        }  catch (err: any) {
            const errorDetail = err.response?.data?.detail || "Optimization failed. Check console and backend logs.";
            setOptimizationError(errorDetail);
            setOptimizationStatus('error');
            console.error(err);
        }
    };

   return (
        <div className="container">
            <h1 className="header">Prompt Engineering Studio</h1>
            <div className="main-grid">
                {/* Left column for the main editor and optimization results */}
                <div className="editor-column">
                    <div className="results-panel editor-container">
                        <h2 className="sub-header">Your Prompt</h2>
                        <textarea
                            className="prompt-textarea"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter your prompt here..."
                        />
                    </div>
                    {optimizationStatus === 'success' && optimizationResult && (
                        <div className="results-panel optimization-results"> {/* Add 'optimization-results' class */}
                            <h2 className="sub-header">🚀 Optimization Complete</h2>
                            <div className="optimization-results-grid">
                                <div>
                                    <h4 className="result-header">Before</h4>
                                    <pre className="prompt-box">{optimizationResult.original_prompt}</pre>
                                </div>
                                <div>
                                    <h4 className="result-header">After</h4>
                                    <pre className="prompt-box">{optimizationResult.optimized_prompt}</pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column for analysis and optimization controls */}
                <div className="analysis-column">
                    <div className="results-panel">
                        <h2 className="sub-header">Pattern Analysis</h2>

                        {/* Pattern Analysis Controls */}
                        <div className="analysis-controls" style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            {/* LLM Refiner Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={useLlmRefiner}
                                        onChange={(e) => setUseLlmRefiner(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    <span>🤖 Use LLM Refiner</span>
                                </label>
                                {useLlmRefiner && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        (Enhanced pattern detection accuracy)
                                    </span>
                                )}
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyzeClick}
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
                                    opacity: isLoading || !prompt.trim() ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isLoading ? '🔍 Analyzing...' : '🔍 Analyze Patterns'}
                            </button>

                            {!prompt.trim() && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                                    Enter a prompt to analyze
                                </span>
                            )}

                            {/* LLM Refiner Configuration */}
                            {useLlmRefiner && (
                                <div className="llm-refiner-config" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Provider
                                        </label>
                                        <select
                                            value={refinerProvider}
                                            onChange={(e) => setRefinerProvider(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                backgroundColor: 'var(--background-card)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="ollama">Ollama (Local)</option>
                                            <option value="openrouter">OpenRouter</option>
                                            <option value="groq">Groq</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            value={refinerModel}
                                            onChange={(e) => setRefinerModel(e.target.value)}
                                            placeholder={refinerProvider === 'ollama' ? 'e.g., gemma:2b' : 'e.g., meta-llama/llama-3-8b-instruct'}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                backgroundColor: 'var(--background-card)',
                                                color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px'
                                            }}
                                        />
                                    </div>

                                    {(refinerProvider === 'openrouter' || refinerProvider === 'groq') && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                API Key
                                            </label>
                                            <input
                                                type="password"
                                                value={refinerApiKey}
                                                onChange={(e) => setRefinerApiKey(e.target.value)}
                                                placeholder={`Your ${refinerProvider} API Key`}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem',
                                                    backgroundColor: 'var(--background-card)',
                                                    color: 'var(--text-primary)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isLoading && <p>Analyzing...</p>}
                        {error && <p className="error-text">{error}</p>}
                        {results && !isLoading && Object.keys(results.patterns).length > 0 && (
                            <div className="patterns-grid">
                                {Object.values(results.patterns).map((p) => (
                                    <div key={p.pattern} className="pattern-card">
                                        <h3 className="pattern-title">{p.pattern.replace(/_/g, ' ')}</h3>
                                        <p className="pattern-category">{p.category}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="results-panel">
                        <h2 className="sub-header">💡 Template Suggestions</h2>
                        {isLoading && <p>Loading suggestions...</p>}
                        {suggestions.length > 0 && !isLoading && (
                            <div className="suggestions-list">
                                {suggestions.map((s) => (
                                    <div key={s.name} className="suggestion-card">
                                        <span className="suggestion-name">{s.name}</span>
                                        <span className="suggestion-score">Match: {s.score}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && !error && results && suggestions.length === 0 && <p>No template suggestions for this prompt.</p>}
                    </div>
                    <div className="results-panel">
                        <h2 className="sub-header">Optimize Prompt</h2>
                        <div className="optimize-controls">
                            {/* Cost Estimation Toggle */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showCostEstimation}
                                        onChange={(e) => setShowCostEstimation(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    <span>💰 Show Cost Estimation</span>
                                </label>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">Optimization Metric</label>
                                <select className="select-input" value={metric} onChange={e => setMetric(e.target.value)}>
                                    <option value="exact_match">Exact Match (Default)</option>
                                    <option value="llm_as_a_judge">LLM-as-a-Judge (Quality Score)</option>
                                </select>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {metric === 'exact_match'
                                        ? 'Optimizes for exact string matches with ground truth answers.'
                                        : 'Uses LLM evaluation for qualitative metrics like style, engagement, and clarity.'
                                    }
                                </div>
                            </div>

                            {/* Guardrails Configuration */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">Max Iterations</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={maxIterations}
                                    onChange={(e) => setMaxIterations(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                    className="text-input"
                                    style={{ width: '100%' }}
                                />
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Controls optimization intensity (1-10 iterations). Higher values may improve results but increase cost and time.
                                </div>
                            </div>

                            <label className="input-label">Provider</label>
                            <select className="select-input" value={provider} onChange={e => setProvider(e.target.value)}>
                                <option value="ollama">Ollama (Local)</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="groq">Groq</option>
                            </select>
                            <label className="input-label">Model Name</label>
                            <input 
                                type="text" 
                                className="text-input" 
                                value={model} 
                                onChange={e => setModel(e.target.value)}
                                placeholder={provider === 'ollama' ? 'e.g., gemma:2b' : 'e.g., meta-llama/llama-3-8b-instruct'}
                            />
                            {(provider === 'openrouter' || provider === 'groq') && (
                                <>
                                    <label className="input-label">API Key</label>
                                    <input 
                                        type="password"
                                        className="text-input"
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        placeholder={`Your ${provider} API Key`}
                                    />
                                </>
                            )}
                            <label className="file-input-label">
                                {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose Dataset File'}
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept=".csv,.jsonl"/>
                            </label>
                            <button onClick={handleOptimizeClick} disabled={optimizationStatus === 'optimizing'}>
                                {optimizationStatus === 'optimizing' ? 'Optimizing...' : 'Start Optimization'}
                            </button>
                        </div>

                        {/* Cost Estimation Display */}
                        {showCostEstimation && costEstimation && !costEstimation.error && (
                            <div className="cost-estimation" style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: 'var(--background-card)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-accent)' }}>💰 Cost Estimation</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <div><strong>Examples:</strong> {costEstimation.total_examples}</div>
                                    <div><strong>Est. Input Tokens:</strong> {costEstimation.estimated_prompt_tokens?.toLocaleString()}</div>
                                    <div><strong>Est. Output Tokens:</strong> {costEstimation.estimated_completion_tokens?.toLocaleString()}</div>
                                    <div><strong>Iterations:</strong> {costEstimation.max_iterations}</div>
                                    <div><strong>Input Cost:</strong> ${costEstimation.input_cost_usd?.toFixed(6)}</div>
                                    <div><strong>Output Cost:</strong> ${costEstimation.output_cost_usd?.toFixed(6)}</div>
                                </div>
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.5rem',
                                    backgroundColor: 'var(--background-dark)',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    Total Estimated Cost: ${costEstimation.total_cost_usd?.toFixed(6)}
                                </div>
                                {costEstimation.note && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        {costEstimation.note}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cost Estimation Error */}
                        {showCostEstimation && costEstimation && costEstimation.error && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                backgroundColor: 'var(--error-color)',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                            }}>
                                Cost estimation failed: {costEstimation.error}
                            </div>
                        )}

                        {optimizationStatus === 'error' && <p className="error-text">{optimizationError}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};



export default PromptAnalyzer;