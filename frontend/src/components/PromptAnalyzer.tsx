import { useState } from 'react';
import type { LLMConfig } from '../types/promptAnalyzer';
import { usePromptAnalysis } from '../hooks/usePromptAnalysis';
import { useTemplateOperations } from '../hooks/useTemplateOperations';
import { usePromptOptimization } from '../hooks/usePromptOptimization';
import PromptInputSection from './PromptInputSection';
import PatternAnalysisResults from './PatternAnalysisResults';
import TemplateSuggestions from './TemplateSuggestions';
import MergedTemplatePreview from './MergedTemplatePreview';
import OptimizationPanel from './OptimizationPanel';
import OptimizationResults from './OptimizationResults';

const PromptAnalyzer = () => {
    // --- Core state ---
    const [prompt, setPrompt] = useState<string>("Answer the following question.");

    // --- LLM Configuration ---
    const [llmConfig, setLLMConfig] = useState<LLMConfig>({
        useLlmRefiner: false,
        refinerProvider: 'ollama',
        refinerModel: 'gemma:2b',
        refinerApiKey: ''
    });

    // Use LLM refiner config for optimization (shared configuration)
    const currentProvider = llmConfig.useLlmRefiner ? llmConfig.refinerProvider : 'ollama';
    const currentModel = llmConfig.useLlmRefiner ? llmConfig.refinerModel : 'gemma:2b';
    const currentApiKey = llmConfig.useLlmRefiner ? llmConfig.refinerApiKey : '';

    // --- Custom Hooks ---
    const {
        results,
        suggestions,
        isLoading,
        error,
        analyzePrompt
    } = usePromptAnalysis(llmConfig);

    const {
        templatePreviewState,
        isMergingTemplate,
        loadTemplatePreview,
        previewTemplateMerge,
        clearMergedTemplates
    } = useTemplateOperations();

    const {
        optimizationConfig,
        setOptimizationConfig,
        costEstimation,
        isEstimatingCost,
        optimizationStatus,
        optimizationResult,
        optimizationError,
        optimizePrompt,
        handleCostEstimation,
        resetOptimization
    } = usePromptOptimization(llmConfig);

    // --- Event Handlers ---
    const handleAnalyzeClick = () => {
        analyzePrompt(prompt);
    };

    const handleLLMConfigChange = (config: Partial<LLMConfig>) => {
        setLLMConfig(prev => ({ ...prev, ...config }));
    };

    const handleTemplateVisible = (templateSlug: string) => {
        loadTemplatePreview(templateSlug);
    };

    const handlePreviewTemplate = async (templateSlug: string) => {
        try {
            await previewTemplateMerge(
                prompt,
                templateSlug,
                llmConfig.refinerProvider,
                llmConfig.refinerModel,
                llmConfig.refinerApiKey
            );
        } catch (err) {
            console.error('Template preview failed:', err);
        }
    };

    const handleApplyMergedTemplate = (templateSlug: string) => {
        const mergedContent = templatePreviewState.mergedTemplates[templateSlug];
        if (mergedContent) {
            setPrompt(mergedContent);
            clearMergedTemplates();
        }
    };

    const handleOptimizeClick = () => {
        optimizePrompt(prompt);
    };

    const handleCostEstimationToggle = (show: boolean) => {
        // This is handled by the usePromptOptimization hook
    };

    return (
        <div className="container">
            <h1 className="header">Prompt Engineering Studio</h1>

            <PromptInputSection
                prompt={prompt}
                setPrompt={setPrompt}
                onAnalyze={handleAnalyzeClick}
                isLoading={isLoading}
                llmConfig={llmConfig}
                onLLMConfigChange={handleLLMConfigChange}
            />

            <div className="main-grid">
                <div className="results-column" style={{ width: '100%' }}>
                    <PatternAnalysisResults
                        results={results}
                        isLoading={isLoading}
                    />

                    <TemplateSuggestions
                        suggestions={suggestions}
                        isLoading={isLoading}
                        templatePreviewState={templatePreviewState}
                        onTemplateVisible={handleTemplateVisible}
                        onPreviewTemplate={handlePreviewTemplate}
                        isMergingTemplate={isMergingTemplate}
                    />

                    <MergedTemplatePreview
                        mergedTemplates={templatePreviewState.mergedTemplates}
                        onApplyMergedTemplate={handleApplyMergedTemplate}
                    />

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

                <div className="controls-column">
                    <OptimizationPanel
                        optimizationConfig={optimizationConfig}
                        onOptimizationConfigChange={(config) => setOptimizationConfig(prev => ({ ...prev, ...config }))}
                        costEstimation={costEstimation}
                        isEstimatingCost={isEstimatingCost}
                        optimizationStatus={optimizationStatus}
                        optimizationError={optimizationError}
                        onOptimize={handleOptimizeClick}
                        onCostEstimationToggle={handleCostEstimationToggle}
                        currentProvider={currentProvider}
                        currentModel={currentModel}
                        useLlmRefiner={llmConfig.useLlmRefiner}
                    />
                </div>
            </div>

            <OptimizationResults
                optimizationStatus={optimizationStatus}
                optimizationResult={optimizationResult}
            />
        </div>
    );
};

export default PromptAnalyzer;