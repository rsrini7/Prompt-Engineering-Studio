import React from 'react';
import type { AnalysisResponse } from '../types/promptAnalyzer';

interface PatternAnalysisResultsProps {
    results: AnalysisResponse | null;
    isLoading: boolean;
}

const PatternAnalysisResults: React.FC<PatternAnalysisResultsProps> = ({
    results,
    isLoading
}) => {
    if (!results || isLoading) {
        return null;
    }

    return (
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
    );
};

export default PatternAnalysisResults;