import React from 'react';

interface MergedTemplatePreviewProps {
    mergedTemplates: Record<string, string>;
    onApplyMergedTemplate: (templateSlug: string) => void;
}

const MergedTemplatePreview: React.FC<MergedTemplatePreviewProps> = ({
    mergedTemplates,
    onApplyMergedTemplate
}) => {
    if (Object.keys(mergedTemplates).length === 0) {
        return null;
    }

    return (
        <>
            <div style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1rem',
                fontStyle: 'italic'
            }}>
                Your prompt after merging with templates:
            </div>

            {Object.entries(mergedTemplates).map(([templateSlug, mergedContent]) => (
                <div key={templateSlug} style={{
                    backgroundColor: 'var(--background-dark)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--primary-accent)',
                        marginBottom: '0.5rem',
                        fontWeight: 'bold'
                    }}>
                        📝 Merged with: {templateSlug}
                    </div>

                    <div style={{
                        backgroundColor: 'var(--background-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        fontFamily: 'monospace'
                    }}>
                        {mergedContent}
                    </div>

                    <div style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={() => {
                                // Copy to clipboard
                                navigator.clipboard.writeText(mergedContent);
                                // You could add a toast notification here
                            }}
                            style={{
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            📋 Copy
                        </button>
                        <button
                            onClick={() => onApplyMergedTemplate(templateSlug)}
                            style={{
                                backgroundColor: 'var(--primary-accent)',
                                color: 'white',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            🚀 Merge & Use
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
};

export default MergedTemplatePreview;