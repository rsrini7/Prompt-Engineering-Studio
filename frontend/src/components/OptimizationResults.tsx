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
            animation: 'fadeIn 0.3s ease-in-out, glow 2s ease-in-out infinite alternate',
            background: 'linear-gradient(135deg, var(--background-panel), var(--background-card))',
            border: '3px solid var(--primary-accent)',
            boxShadow: '0 0 30px rgba(13, 142, 255, 0.4)',
            marginTop: '1.5rem',
            marginBottom: '1rem',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'visible'
        }}>
            <div style={{
                position: 'absolute',
                top: '-3px',
                left: '-3px',
                right: '-3px',
                height: '6px',
                background: 'linear-gradient(90deg, var(--primary-accent), var(--primary-accent-hover), var(--primary-accent))',
                borderRadius: '16px 16px 0 0',
                animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <h2 className="sub-header" style={{
                textAlign: 'center',
                marginBottom: '1.5rem',
                color: 'var(--primary-accent)',
                fontSize: '1.5rem',
                fontWeight: '800',
                textShadow: '0 2px 8px rgba(13, 142, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
            }}>
                <span style={{
                    fontSize: '1.8rem',
                    animation: 'bounce 2s ease-in-out infinite'
                }}>🚀</span>
                Optimization Complete
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