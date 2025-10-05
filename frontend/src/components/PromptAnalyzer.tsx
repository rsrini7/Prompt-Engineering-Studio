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
    const [isEstimatingCost, setIsEstimatingCost] = useState<boolean>(false);

    // --- State for tabbed interface ---
    const [activeTab, setActiveTab] = useState<'analyze' | 'optimize'>('analyze');

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

    // Auto-trigger cost estimation when file or model changes
    useEffect(() => {
        if (selectedFile && model && showCostEstimation && activeTab === 'optimize') {
            const timeoutId = setTimeout(() => {
                handleCostEstimation();
            }, 1000); // 1 second delay to avoid excessive API calls

            return () => clearTimeout(timeoutId);
        }
    }, [selectedFile, model, maxIterations, provider, showCostEstimation, activeTab]);

    // Handle cost estimation
    const handleCostEstimation = async () => {
        if (!selectedFile || !model) {
            setCostEstimation(null);
            return;
        }

        setIsEstimatingCost(true);
        try {
            const estimationFormData = new FormData();
            estimationFormData.append('dataset', selectedFile);
            estimationFormData.append('provider', provider);
            estimationFormData.append('model', model);
            estimationFormData.append('max_iterations', maxIterations.toString());

            console.log('Estimating cost for:', { provider, model, maxIterations, file: selectedFile.name });

            const response = await axios.post('http://127.0.0.1:8000/api/optimize/estimate', estimationFormData);
            console.log('Cost estimation response:', response.data);
            setCostEstimation(response.data);
        } catch (err) {
            console.error('Cost estimation failed:', err);
            setCostEstimation({
                error: 'Failed to estimate cost',
                total_cost_usd: 0,
                total_examples: 0,
                estimated_prompt_tokens: 0,
                estimated_completion_tokens: 0
            });
        } finally {
            setIsEstimatingCost(false);
        }
    };

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

        // Check cost estimation and confirm if expensive (cloud providers)
        if (costEstimation && !costEstimation.error && provider !== 'ollama' && costEstimation.total_cost_usd > 0.001) {
            const confirmed = window.confirm(
                `This optimization may cost approximately $${costEstimation.total_cost_usd.toFixed(6)}. Do you want to proceed?`
            );
            if (!confirmed) {
                setOptimizationStatus('idle');
                return;
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
                    {/* Tabbed Interface for Better Organization */}
                    <div className="tabbed-interface">
                        {/* Tab Navigation */}
                        <div className="tab-navigation" style={{
                            display: 'flex',
                            borderBottom: '2px solid var(--border-color)',
                            marginBottom: '1rem'
                        }}>
                            <button
                                className={`tab-button ${activeTab === 'analyze' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analyze')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    backgroundColor: activeTab === 'analyze' ? 'var(--primary-accent)' : 'var(--background-panel)',
                                    color: activeTab === 'analyze' ? 'white' : 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                🔍 Analyze
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'optimize' ? 'active' : ''}`}
                                onClick={() => setActiveTab('optimize')}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    backgroundColor: activeTab === 'optimize' ? 'var(--primary-accent)' : 'var(--background-panel)',
                                    color: activeTab === 'optimize' ? 'white' : 'var(--text-primary)',
                                    border: 'none',
                                    borderRadius: '8px 8px 0 0',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                ⚡ Optimize
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="tab-content">
                            {/* Analysis Tab */}
                            {activeTab === 'analyze' && (
                                <div className="analysis-tab">
                                    <div className="results-panel">
                                        <h2 className="sub-header">Pattern Analysis</h2>

                                        {/* Quick Action Bar */}
                                        <div className="quick-actions" style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            marginBottom: '1rem',
                                            alignItems: 'center',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* LLM Refiner Toggle */}
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={useLlmRefiner}
                                                    onChange={(e) => setUseLlmRefiner(e.target.checked)}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span>🤖 LLM Refiner</span>
                                            </label>

                                            {/* Analyze Button */}
                                            <button
                                                onClick={handleAnalyzeClick}
                                                disabled={isLoading || !prompt.trim()}
                                                style={{
                                                    backgroundColor: 'var(--primary-accent)',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500',
                                                    opacity: isLoading || !prompt.trim() ? 0.6 : 1
                                                }}
                                            >
                                                {isLoading ? '🔍 Analyzing...' : '🔍 Analyze'}
                                            </button>
                                        </div>

                                        {/* LLM Refiner Configuration (Collapsible) */}
                                        {useLlmRefiner && (
                                            <div className="llm-config-panel" style={{
                                                backgroundColor: 'var(--background-dark)',
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                marginBottom: '1rem',
                                                animation: 'fadeIn 0.3s ease-in-out'
                                            }}>
                                                <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-accent)' }}>🤖 LLM Configuration</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
                                                            <option value="ollama">Ollama</option>
                                                            <option value="openrouter">OpenRouter</option>
                                                            <option value="groq">Groq</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            Model
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={refinerModel}
                                                            onChange={(e) => setRefinerModel(e.target.value)}
                                                            placeholder={refinerProvider === 'ollama' ? 'gemma:2b' : 'meta-llama/llama-3-8b-instruct'}
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
                                                </div>

                                                {(refinerProvider === 'openrouter' || refinerProvider === 'groq') && (
                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            API Key
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={refinerApiKey}
                                                            onChange={(e) => setRefinerApiKey(e.target.value)}
                                                            placeholder={`${refinerProvider} API Key`}
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

                                        {/* Pattern Results */}
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

                                    {/* Template Suggestions - Compact View */}
                                    <div className="results-panel" style={{ marginTop: '1rem' }}>
                                        <h2 className="sub-header">💡 Templates</h2>
                                        {isLoading && <p>Loading suggestions...</p>}
                                        {suggestions.length > 0 && !isLoading && (
                                            <div className="suggestions-list">
                                                {suggestions.slice(0, 3).map((s) => (
                                                    <div key={s.name} className="suggestion-card">
                                                        <span className="suggestion-name">{s.name}</span>
                                                        <span className="suggestion-score">Match: {s.score}%</span>
                                                    </div>
                                                ))}
                                                {suggestions.length > 3 && (
                                                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            +{suggestions.length - 3} more suggestions
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!isLoading && !error && results && suggestions.length === 0 && <p>No template suggestions for this prompt.</p>}
                                    </div>
                                </div>
                            )}

                            {/* Optimization Tab */}
                            {activeTab === 'optimize' && (
                                <div className="optimization-tab">
                                    <div className="results-panel">
                                        <h2 className="sub-header">⚡ Prompt Optimization</h2>

                                        {/* Quick Configuration Bar */}
                                        <div className="config-bar" style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '1rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div>
                                                <label className="input-label">Metric</label>
                                                <select className="select-input" value={metric} onChange={e => setMetric(e.target.value)}>
                                                    <option value="exact_match">Exact Match</option>
                                                    <option value="llm_as_a_judge">LLM Judge</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="input-label">Max Iterations</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={maxIterations}
                                                    onChange={(e) => setMaxIterations(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                                    className="text-input"
                                                />
                                            </div>
                                        </div>

                                        {/* Provider Configuration */}
                                        <div className="provider-config" style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '1rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div>
                                                <label className="input-label">Provider</label>
                                                <select className="select-input" value={provider} onChange={e => setProvider(e.target.value)}>
                                                    <option value="ollama">Ollama</option>
                                                    <option value="openrouter">OpenRouter</option>
                                                    <option value="groq">Groq</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="input-label">Model</label>
                                                <input
                                                    type="text"
                                                    className="text-input"
                                                    value={model}
                                                    onChange={e => setModel(e.target.value)}
                                                    placeholder={provider === 'ollama' ? 'gemma:2b' : 'meta-llama/llama-3-8b-instruct'}
                                                />
                                            </div>
                                        </div>

                                        {/* API Key (conditional) */}
                                        {(provider === 'openrouter' || provider === 'groq') && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label className="input-label">API Key</label>
                                                <input
                                                    type="password"
                                                    className="text-input"
                                                    value={apiKey}
                                                    onChange={e => setApiKey(e.target.value)}
                                                    placeholder={`${provider} API Key`}
                                                />
                                            </div>
                                        )}

                                        {/* File Upload & Action */}
                                        <div className="file-upload-section" style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            alignItems: 'center',
                                            marginBottom: '1rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            <label className="file-input-label" style={{ flex: 1, minWidth: '200px' }}>
                                                {selectedFile ? `✅ ${selectedFile.name}` : '📁 Choose Dataset File'}
                                                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept=".csv,.jsonl"/>
                                            </label>

                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <button
                                                    onClick={handleOptimizeClick}
                                                    disabled={optimizationStatus === 'optimizing' || !selectedFile}
                                                    style={{
                                                        backgroundColor: 'var(--primary-accent)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.75rem 1.5rem',
                                                        borderRadius: '8px',
                                                        cursor: optimizationStatus === 'optimizing' || !selectedFile ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '500',
                                                        opacity: optimizationStatus === 'optimizing' || !selectedFile ? 0.6 : 1
                                                    }}
                                                >
                                                    {optimizationStatus === 'optimizing' ? '⚡ Optimizing...' : '⚡ Start Optimization'}
                                                </button>

                                                {/* Manual cost estimation trigger */}
                                                <button
                                                    onClick={handleCostEstimation}
                                                    disabled={!selectedFile || !model}
                                                    style={{
                                                        backgroundColor: 'var(--background-card)',
                                                        color: 'var(--text-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '6px',
                                                        cursor: !selectedFile || !model ? 'not-allowed' : 'pointer',
                                                        fontSize: '0.8rem',
                                                        opacity: !selectedFile || !model ? 0.6 : 1
                                                    }}
                                                    title="Refresh cost estimation"
                                                >
                                                    🔄
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cost Estimation Toggle */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={showCostEstimation}
                                                    onChange={(e) => {
                                                        setShowCostEstimation(e.target.checked);
                                                        // Trigger cost estimation when toggled on
                                                        if (e.target.checked && selectedFile && model) {
                                                            setTimeout(() => handleCostEstimation(), 100);
                                                        }
                                                    }}
                                                    style={{ width: 'auto' }}
                                                />
                                                <span>💰 Show Cost Estimation</span>
                                            </label>
                                        </div>

                                        {/* Cost Estimation Display */}
                                        {showCostEstimation && (
                                            <>
                                                {/* Loading State */}
                                                {isEstimatingCost && (
                                                    <div className="cost-display" style={{
                                                        backgroundColor: 'var(--background-dark)',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        marginTop: '1rem',
                                                        border: '1px solid var(--border-color)',
                                                        textAlign: 'center'
                                                    }}>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                            🔄 Calculating cost estimation...
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Cost Results */}
                                                {costEstimation && costEstimation.total_cost_usd !== undefined && !isEstimatingCost && (
                                                    <div className="cost-display" style={{
                                                        backgroundColor: 'var(--background-dark)',
                                                        padding: '0.75rem',
                                                        borderRadius: '8px',
                                                        marginTop: '1rem',
                                                        border: '1px solid var(--border-color)',
                                                        animation: 'fadeIn 0.3s ease-in-out'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                                Estimated Cost:
                                                            </span>
                                                            <span style={{
                                                                fontSize: '1.1rem',
                                                                fontWeight: 'bold',
                                                                color: provider !== 'ollama' && costEstimation.total_cost_usd > 0.01 ? 'var(--error-color)' : 'var(--primary-accent)'
                                                            }}>
                                                                ${costEstimation.total_cost_usd?.toFixed(6)}
                                                            </span>
                                                        </div>

                                                        {provider !== 'ollama' && costEstimation.total_cost_usd > 0.01 && (
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                color: 'var(--error-color)',
                                                                backgroundColor: 'rgba(255, 85, 85, 0.1)',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '4px',
                                                                marginBottom: '0.5rem'
                                                            }}>
                                                                ⚠️ Higher cost detected - confirm before proceeding
                                                            </div>
                                                        )}

                                                        {provider === 'ollama' && (
                                                            <div style={{
                                                                fontSize: '0.8rem',
                                                                color: 'var(--primary-accent)',
                                                                backgroundColor: 'rgba(13, 142, 255, 0.1)',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '4px',
                                                                marginBottom: '0.5rem',
                                                                textAlign: 'center'
                                                            }}>
                                                                ✅ Free local inference
                                                            </div>
                                                        )}

                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: 'var(--text-secondary)',
                                                            textAlign: 'center'
                                                        }}>
                                                            {costEstimation.total_examples || 0} examples × {costEstimation.max_iterations || maxIterations} iterations
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Cost Estimation Error */}
                                        {costEstimation && costEstimation.error && (
                                            <div style={{
                                                backgroundColor: 'var(--error-color)',
                                                color: 'white',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                marginTop: '1rem',
                                                fontSize: '0.8rem'
                                            }}>
                                                Cost estimation failed: {costEstimation.error}
                                            </div>
                                        )}

                                        {optimizationStatus === 'error' && <p className="error-text">{optimizationError}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



export default PromptAnalyzer;