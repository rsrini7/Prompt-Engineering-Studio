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

    // This useEffect hook handles the real-time analysis and suggestions
    useEffect(() => {
        if (!prompt.trim()) {
            setResults(null);
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestions([]);

        const handler = setTimeout(() => {
            axios.post<AnalysisResponse>('http://127.0.0.1:8000/api/analyze', { prompt })
                .then(response => {
                    const analysisResults = response.data;
                    setResults(analysisResults);
                    if (analysisResults && Object.keys(analysisResults.patterns).length > 0) {
                        return axios.post('http://127.0.0.1:8000/api/templates/suggest', analysisResults);
                    }
                })
                .then(suggestionResponse => {
                    if (suggestionResponse) {
                        setSuggestions(suggestionResponse.data.suggestions);
                    }
                })
                .catch(err => {
                    setError('Failed to fetch data. Make sure the backend is running.');
                    console.error(err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }, 500);

        return () => clearTimeout(handler);
    }, [prompt]);

    // Handler function for the optimize button
    const handleOptimizeClick = async () => {
        if (!selectedFile) {
            setOptimizationError("Please select a dataset file first.");
            return;
        }
        setOptimizationStatus('optimizing');
        setOptimizationError('');
        setOptimizationResult(null);

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('dataset', selectedFile);

        try {
            const response = await axios.post<OptimizationResult>('http://127.0.0.1:8000/api/optimize', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Optimization response received:", response.data); 

            setOptimizationResult(response.data);
            setOptimizationStatus('success');
        } catch (err) {
            setOptimizationError("Optimization failed. Check the console and backend logs.");
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
                            <label className="file-input-label">
                                {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose Dataset File'}
                                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} accept=".csv,.jsonl"/>
                            </label>
                            <button onClick={handleOptimizeClick} disabled={optimizationStatus === 'optimizing'}>
                                {optimizationStatus === 'optimizing' ? 'Optimizing...' : 'Start Optimization'}
                            </button>
                        </div>
                        {optimizationStatus === 'error' && <p className="error-text">{optimizationError}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};



export default PromptAnalyzer;