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
    content?: string;
    variables?: string[];
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
    const [metric, setMetric] = useState<string>('exact_match');
    const [maxIterations, setMaxIterations] = useState<number>(4);

    // Use LLM refiner config for optimization (shared configuration)
    const currentProvider = useLlmRefiner ? refinerProvider : 'ollama';
    const currentModel = useLlmRefiner ? refinerModel : 'gemma:2b';
    const currentApiKey = useLlmRefiner ? refinerApiKey : '';

    // --- State for cost estimation ---
    const [costEstimation, setCostEstimation] = useState<any>(null);
    const [showCostEstimation, setShowCostEstimation] = useState<boolean>(false);
    const [isEstimatingCost, setIsEstimatingCost] = useState<boolean>(false);

    // --- State for tabbed interface ---
    const [activeTab, setActiveTab] = useState<'analyze' | 'optimize'>('analyze');

    // --- State for template merging ---
    const [isMergingTemplate, setIsMergingTemplate] = useState<boolean>(false);

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
        if (selectedFile && currentModel && showCostEstimation && activeTab === 'optimize') {
            const timeoutId = setTimeout(() => {
                handleCostEstimation();
            }, 1000); // 1 second delay to avoid excessive API calls

            return () => clearTimeout(timeoutId);
        }
    }, [selectedFile, currentModel, maxIterations, currentProvider, showCostEstimation, activeTab]);

    // Handle cost estimation
    const handleCostEstimation = async () => {
        if (!selectedFile || !currentModel) {
            setCostEstimation(null);
            return;
        }

        setIsEstimatingCost(true);
        try {
            const estimationFormData = new FormData();
            estimationFormData.append('dataset', selectedFile);
            estimationFormData.append('provider', currentProvider);
            estimationFormData.append('model', currentModel);
            estimationFormData.append('max_iterations', maxIterations.toString());

            console.log('Estimating cost for:', { provider: currentProvider, model: currentModel, maxIterations, file: selectedFile.name });

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

    // Handler function for template merging
    const handleMergeTemplate = async (templateSlug: string) => {
        if (!prompt.trim()) {
            setError('Please enter a prompt first.');
            return;
        }

        setIsMergingTemplate(true);
        try {
            const formData = new FormData();
            formData.append('user_prompt', prompt);
            formData.append('template_slug', templateSlug);
            formData.append('provider', refinerProvider);
            formData.append('model', refinerModel);
            formData.append('api_key', refinerApiKey);

            const response = await axios.post('http://127.0.0.1:8000/api/templates/merge', formData);
            const mergedTemplate = response.data.merged_template;

            // Replace the prompt with the merged template
            setPrompt(mergedTemplate);

            // Switch to analyze tab to see the new prompt
            setActiveTab('analyze');

        } catch (err) {
            setError('Failed to merge template. Please try again.');
            console.error(err);
        } finally {
            setIsMergingTemplate(false);
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
            setOptimizationStatus('error');
            return;
        }
        if (!currentModel.trim()) {
            setOptimizationError("Please enter a model name.");
            setOptimizationStatus('error');
            return;
        }
        if ((currentProvider === 'openrouter' || currentProvider === 'groq') && !currentApiKey.trim()) {
            setOptimizationError(`Please enter an API key for ${currentProvider}.`);
            setOptimizationStatus('error');
            return;
        }

        // Check cost estimation and confirm if expensive (cloud providers)
        if (costEstimation && !costEstimation.error && currentProvider !== 'ollama' && costEstimation.total_cost_usd > 0.001) {
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
        formData.append('provider', currentProvider);
        formData.append('model', currentModel);
        formData.append('api_key', currentApiKey);
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

           {/* Compact Prompt Input Section */}
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
                               opacity: isLoading || !prompt.trim() ? 0.6 : 1
                           }}
                       >
                           {isLoading ? '🔍 Analyzing...' : '🔍 Analyze'}
                       </button>
                       <button
                           onClick={() => {
                               setActiveTab('optimize');
                               // Scroll to optimization section
                               setTimeout(() => {
                                   const optimizeSection = document.querySelector('.controls-column');
                                   if (optimizeSection) {
                                       optimizeSection.scrollIntoView({
                                           behavior: 'smooth',
                                           block: 'center'
                                       });
                                   }
                               }, 100);
                           }}
                           style={{
                               backgroundColor: 'var(--background-card)',
                               color: 'var(--text-primary)',
                               border: '1px solid var(--border-color)',
                               padding: '0.75rem 1.5rem',
                               borderRadius: '8px',
                               cursor: 'pointer',
                               fontSize: '0.9rem',
                               fontWeight: '500',
                               position: 'relative'
                           }}
                           title="🔄 Switch to optimization tab"
                       >
                           ⚡ Go to Optimize
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
                           checked={useLlmRefiner}
                           onChange={(e) => setUseLlmRefiner(e.target.checked)}
                           style={{ width: 'auto' }}
                       />
                       <span>🤖 LLM Refiner</span>
                   </label>
                   {useLlmRefiner && (
                       <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                           <select
                               value={refinerProvider}
                               onChange={(e) => setRefinerProvider(e.target.value)}
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
                               value={refinerModel}
                               onChange={(e) => setRefinerModel(e.target.value)}
                               placeholder={refinerProvider === 'ollama' ? 'gemma:2b' : 'meta-llama/llama-3-8b-instruct'}
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
                       </div>
                   )}
               </div>
           </div>

           {/* Main Content Area */}
           <div className="main-grid">
               {/* Left column for results and templates */}
               <div className="results-column" style={{ width: '100%' }}>
                   {/* Pattern Analysis Results */}
                   {results && !isLoading && (
                       <div className="results-panel" style={{
                           backgroundColor: 'var(--background-panel)',
                           border: '1px solid var(--border-color)',
                           borderRadius: '12px',
                           marginBottom: '1.5rem'
                       }}>
                           <h2 className="sub-header" style={{ marginBottom: '1rem' }}>🔍 Pattern Analysis</h2>

                           {/* Pattern Cards */}
                           <div className="patterns-grid">
                               {Object.values(results.patterns).map((pattern) => (
                                   <div key={pattern.pattern} className="pattern-card">
                                       <div className="pattern-title">
                                           {pattern.pattern.replace(/_/g, ' ')}
                                       </div>
                                       <div className="pattern-category">
                                           {pattern.category}
                                       </div>
                                       <div style={{
                                           backgroundColor: pattern.confidence > 0.7 ? '#10b981' : pattern.confidence > 0.4 ? '#f59e0b' : '#ef4444',
                                           color: 'white',
                                           padding: '0.25rem 0.5rem',
                                           borderRadius: '12px',
                                           fontSize: '0.7rem',
                                           fontWeight: 'bold',
                                           marginTop: '0.5rem'
                                       }}>
                                           {Math.round(pattern.confidence * 100)}% confidence
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>
                   )}

                   {/* Template Suggestions */}
                   {suggestions.length > 0 && !isLoading && (
                       <div className="results-panel" style={{
                           backgroundColor: 'var(--background-panel)',
                           border: '1px solid var(--border-color)',
                           borderRadius: '12px'
                       }}>
                           <h2 className="sub-header" style={{ marginBottom: '1rem' }}>💡 Template Suggestions</h2>

                           <div className="suggestions-list">
                               {suggestions.slice(0, 6).map((suggestion) => (
                                   <div key={suggestion.name} className="suggestion-card">
                                       <div className="suggestion-name">
                                           {suggestion.name}
                                       </div>
                                       <div className="suggestion-score">
                                           {suggestion.score}% match
                                       </div>

                                       <div className="template-preview">
                                           Template preview will be loaded...
                                       </div>

                                       <button
                                           className="merge-button"
                                           onClick={() => handleMergeTemplate(suggestion.name)}
                                           disabled={isMergingTemplate}
                                       >
                                           {isMergingTemplate ? '🔄 Merging...' : '🚀 Merge & Use'}
                                       </button>
                                   </div>
                               ))}
                           </div>

                           {suggestions.length > 6 && (
                               <div style={{
                                   textAlign: 'center',
                                   marginTop: '1rem',
                                   padding: '0.75rem',
                                   backgroundColor: 'var(--background-dark)',
                                   borderRadius: '6px',
                                   fontSize: '0.8rem',
                                   color: 'var(--text-secondary)'
                               }}>
                                   +{suggestions.length - 6} more suggestions available
                               </div>
                           )}
                       </div>
                   )}

                   {/* Loading and Error States */}
                   {isLoading && (
                       <div className="results-panel" style={{
                           backgroundColor: 'var(--background-panel)',
                           border: '1px solid var(--border-color)',
                           borderRadius: '12px',
                           textAlign: 'center',
                           padding: '2rem'
                       }}>
                           <div style={{ fontSize: '1.1rem', color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>
                               🔍 Analyzing your prompt...
                           </div>
                           <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                               This may take a few moments
                           </div>
                       </div>
                   )}

                   {error && (
                       <div className="results-panel" style={{
                           backgroundColor: 'var(--error-color)',
                           color: 'white',
                           borderRadius: '12px',
                           padding: '1rem',
                           textAlign: 'center'
                       }}>
                           <div style={{ fontSize: '0.9rem' }}>{error}</div>
                       </div>
                   )}

                   {!isLoading && !error && !results && (
                       <div className="results-panel" style={{
                           backgroundColor: 'var(--background-panel)',
                           border: '1px solid var(--border-color)',
                           borderRadius: '12px',
                           textAlign: 'center',
                           padding: '2rem',
                           color: 'var(--text-secondary)'
                       }}>
                           <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                               📊 Ready to analyze
                           </div>
                           <div style={{ fontSize: '0.9rem' }}>
                               Enter a prompt above and click "Analyze" to get started
                           </div>
                       </div>
                   )}
               </div>

               {/* Right column for optimization controls */}
               <div className="controls-column">
                   {/* Optimization Panel */}
                   <div className="results-panel">
                       <h2 className="sub-header">⚡ Prompt Optimization</h2>

                       {/* Quick Configuration */}
                       <div style={{
                           display: 'grid',
                           gridTemplateColumns: '1fr 1fr',
                           gap: '1rem',
                           marginBottom: '1.5rem'
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

                       {/* Shared LLM Configuration Notice */}
                       <div style={{
                           backgroundColor: 'var(--background-dark)',
                           padding: '1rem',
                           borderRadius: '8px',
                           marginBottom: '1.5rem',
                           border: '1px solid var(--primary-accent)'
                       }}>
                           <div style={{ fontSize: '0.9rem', color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>
                               🤖 Using Shared LLM Configuration
                           </div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                               Provider: {currentProvider} | Model: {currentModel}
                               {useLlmRefiner && " (configured above)"}
                               {!useLlmRefiner && " (using defaults)"}
                           </div>
                       </div>

                       {/* File Upload & Optimize Button */}
                       <div style={{
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
                       </div>

                       {/* Cost Estimation Toggle & Display */}
                       <div style={{ marginBottom: '1rem' }}>
                           <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                               <input
                                   type="checkbox"
                                   checked={showCostEstimation}
                                   onChange={(e) => {
                                       setShowCostEstimation(e.target.checked);
                                       if (e.target.checked && selectedFile && currentModel) {
                                           setTimeout(() => handleCostEstimation(), 100);
                                       }
                                   }}
                                   style={{ width: 'auto' }}
                               />
                               <span>💰 Show Cost Estimation</span>
                           </label>
                       </div>

                       {/* Cost Display */}
                       {showCostEstimation && costEstimation && costEstimation.total_cost_usd !== undefined && !isEstimatingCost && (
                           <div className="cost-display" style={{
                               backgroundColor: 'var(--background-dark)',
                               padding: '0.75rem',
                               borderRadius: '8px',
                               marginTop: '1rem',
                               border: '1px solid var(--border-color)'
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
                                       color: currentProvider !== 'ollama' && costEstimation.total_cost_usd > 0.01 ? 'var(--error-color)' : 'var(--primary-accent)'
                                   }}>
                                       ${costEstimation.total_cost_usd?.toFixed(6)}
                                   </span>
                               </div>

                               {currentProvider !== 'ollama' && costEstimation.total_cost_usd > 0.01 && (
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

                               {currentProvider === 'ollama' && (
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

                       {optimizationStatus === 'error' && <p className="error-text">{optimizationError}</p>}
                   </div>
               </div>
           </div>

           {/* Optimization Results - Full Width Section Below */}
           {optimizationStatus === 'success' && optimizationResult && (
               <div className="optimization-results" style={{
                   width: '100%',
                   padding: '2rem',
                   borderRadius: '16px',
                   animation: 'fadeIn 0.3s ease-in-out'
               }}>
                   <h2 className="sub-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                       🚀 Optimization Complete
                   </h2>
                   <div className="optimization-results-grid">
                       <div style={{ textAlign: 'center' }}>
                           <h4 className="result-header">📝 Original Prompt</h4>
                           <pre className="prompt-box">{optimizationResult.original_prompt}</pre>
                       </div>
                       <div style={{ textAlign: 'center' }}>
                           <h4 className="result-header">✨ Optimized Prompt</h4>
                           <pre className="prompt-box">{optimizationResult.optimized_prompt}</pre>
                       </div>
                   </div>
               </div>
           )}
       </div>
   );
};



export default PromptAnalyzer;