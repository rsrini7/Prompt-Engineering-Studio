import React from 'react';
import type { OptimizationConfig, CostEstimation, OptimizationStatus, OptimizationResult, LLMConfig } from '../types/promptAnalyzer';
import OptimizationResults from './OptimizationResults';

interface OptimizationPanelProps {
    optimizationConfig: OptimizationConfig;
    onOptimizationConfigChange: (config: Partial<OptimizationConfig>) => void;
    costEstimation: CostEstimation | null;
    isEstimatingCost: boolean;
    optimizationStatus: OptimizationStatus;
    optimizationResult: OptimizationResult | null;
    optimizationError: string;
    onOptimize: () => void;
    onCostEstimationToggle: (show: boolean) => void;
    currentProvider: string;
    currentModel: string;
    useLlmRefiner: boolean;
}

const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
    optimizationConfig,
    onOptimizationConfigChange,
    costEstimation,
    isEstimatingCost,
    optimizationStatus,
    optimizationResult,
    optimizationError,
    onOptimize,
    onCostEstimationToggle,
    currentProvider,
    currentModel,
    useLlmRefiner
}) => {
    return (
        <>
             {/* Quick Configuration */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div>
                    <label className="input-label">Metric</label>
                    <select
                        className="select-input"
                        value={optimizationConfig.metric}
                        onChange={e => onOptimizationConfigChange({ metric: e.target.value })}
                    >
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
                        value={optimizationConfig.maxIterations}
                        onChange={(e) => onOptimizationConfigChange({
                            maxIterations: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                        })}
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
                    {useLlmRefiner ? " (configured above)" : " (using defaults)"}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', marginTop: '0.5rem', fontWeight: '500' }}>
                    💡 API keys are automatically loaded from .env.local
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
                    {optimizationConfig.selectedFile ? `✅ ${optimizationConfig.selectedFile.name}` : '📁 Choose Dataset File'}
                    <input
                        type="file"
                        onChange={(e) => onOptimizationConfigChange({
                            selectedFile: e.target.files ? e.target.files[0] : null
                        })}
                        accept=".csv,.jsonl"
                    />
                </label>

                <button
                    onClick={onOptimize}
                    disabled={optimizationStatus === 'optimizing' || !optimizationConfig.selectedFile}
                    style={{
                        backgroundColor: 'var(--primary-accent)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: optimizationStatus === 'optimizing' || !optimizationConfig.selectedFile ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        opacity: optimizationStatus === 'optimizing' || !optimizationConfig.selectedFile ? 0.6 : 1
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
                        checked={optimizationConfig.showCostEstimation}
                        onChange={(e) => {
                            onOptimizationConfigChange({ showCostEstimation: e.target.checked });
                            onCostEstimationToggle(e.target.checked);
                        }}
                        style={{ width: 'auto' }}
                    />
                    <span>💰 Show Cost Estimation</span>
                </label>
            </div>

            {/* Cost Display */}
            {optimizationConfig.showCostEstimation && costEstimation && costEstimation.total_cost_usd !== undefined && !isEstimatingCost && (
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
                        {costEstimation.total_examples || 0} examples × {costEstimation.max_iterations || optimizationConfig.maxIterations} iterations
                    </div>
                </div>
            )}

            {optimizationStatus === 'error' && <p className="error-text">{optimizationError}</p>}

            {/* Optimization Results - shown within the panel */}
            <OptimizationResults
                optimizationStatus={optimizationStatus}
                optimizationResult={optimizationResult}
            />
        </>
    );
};

export default OptimizationPanel;