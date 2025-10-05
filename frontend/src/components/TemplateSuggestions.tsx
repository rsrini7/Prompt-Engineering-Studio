import React from 'react';
import type { TemplateSuggestion, TemplatePreviewState } from '../types/promptAnalyzer';

interface TemplateSuggestionsProps {
    suggestions: TemplateSuggestion[];
    isLoading: boolean;
    templatePreviewState: TemplatePreviewState;
    onTemplateVisible: (templateSlug: string) => void;
    onPreviewTemplate: (templateSlug: string) => void;
    isMergingTemplate: boolean;
}

const TemplateSuggestions: React.FC<TemplateSuggestionsProps> = ({
    suggestions,
    isLoading,
    templatePreviewState,
    onTemplateVisible,
    onPreviewTemplate,
    isMergingTemplate
}) => {
    if (suggestions.length === 0 || isLoading) {
        return null;
    }

    const { templatePreviews, loadingPreviews, previewErrors } = templatePreviewState;

    return (
        <>
            <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                fontStyle: 'italic',
                textAlign: 'center'
            }}>
                💡 Click "Preview Merge" to see how your prompt merges with each template, then use "Merge & Use" below to apply it.
            </div>

            <div className="suggestions-list">
                {suggestions.slice(0, 6).map((suggestion) => (
                    <div
                        key={suggestion.name}
                        className="suggestion-card"
                        onMouseEnter={() => onTemplateVisible(suggestion.name)}
                    >
                        <div className="suggestion-name">
                            {suggestion.name}
                        </div>
                        <div className="suggestion-score">
                            {suggestion.score}% match
                        </div>

                        <div className="template-preview">
                            {loadingPreviews[suggestion.name] ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--primary-accent)',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    height: '100%'
                                }}>
                                    <span style={{ fontSize: '0.7rem' }}>⏳</span>
                                    Loading...
                                </div>
                            ) : previewErrors[suggestion.name] ? (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--error-color)',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    height: '100%'
                                }}>
                                    <span style={{ fontSize: '0.7rem' }}>⚠️</span>
                                    {previewErrors[suggestion.name]}
                                </div>
                            ) : templatePreviews[suggestion.name] ? (
                                <div style={{
                                    fontSize: '0.75rem',
                                    lineHeight: '1.3',
                                    height: '80px',
                                    overflow: 'hidden',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    position: 'relative'
                                }}>
                                    {templatePreviews[suggestion.name]}
                                    {templatePreviews[suggestion.name].length > 150 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            background: 'linear-gradient(90deg, transparent, var(--background-dark))',
                                            padding: '0 1rem',
                                            fontSize: '0.7rem',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 'bold'
                                        }}>
                                            ...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    height: '100%'
                                }}>
                                    <span style={{ fontSize: '0.7rem' }}>👆</span>
                                    Hover to load
                                </div>
                            )}
                        </div>

                        <button
                            className="merge-button"
                            onClick={() => onPreviewTemplate(suggestion.name)}
                            disabled={isMergingTemplate}
                        >
                            {isMergingTemplate ? '🔄 Previewing...' : '🚀 Preview Merge'}
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
        </>
    );
};

export default TemplateSuggestions;