import React from 'react';
import type { OptimizationResult, OptimizationStatus } from '../types/promptAnalyzer';

interface OptimizationResultsProps {
    optimizationStatus: OptimizationStatus;
    optimizationResult: OptimizationResult | null;
}

const OptimizationResults: React.FC<OptimizationResultsProps> = ({
    optimizationStatus,
    optimizationResult
}) => {
    if (optimizationStatus !== 'success' || !optimizationResult) {
        return null;
    }

    return (
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
    );
};

export default OptimizationResults;