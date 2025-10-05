import React, { useState } from 'react';

interface DatasetExample {
    question: string;
    answer: string;
}

interface DatasetBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onDatasetCreated: (file: File) => void;
}

const DatasetBuilder: React.FC<DatasetBuilderProps> = ({
    isOpen,
    onClose,
    onDatasetCreated
}) => {
    const [examples, setExamples] = useState<DatasetExample[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');

    const addExample = () => {
        if (currentQuestion.trim() && currentAnswer.trim()) {
            setExamples(prev => [...prev, {
                question: currentQuestion.trim(),
                answer: currentAnswer.trim()
            }]);
            setCurrentQuestion('');
            setCurrentAnswer('');
        }
    };

    const removeExample = (index: number) => {
        setExamples(prev => prev.filter((_, i) => i !== index));
    };

    const generateCSV = (): string => {
        const headers = ['question', 'answer'];
        const csvContent = [
            headers.join(','),
            ...examples.map(example => `"${example.question.replace(/"/g, '""')}","${example.answer.replace(/"/g, '""')}"`)
        ].join('\n');
        return csvContent;
    };

    const handleUseDataset = () => {
        if (examples.length === 0) return;

        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], 'dataset.csv', { type: 'text/csv' });

        onDatasetCreated(file);
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent, field: 'question' | 'answer') => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            addExample();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'var(--background-panel)',
                border: '2px solid var(--primary-accent)',
                borderRadius: '16px',
                padding: '2rem',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                minHeight: '600px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '1rem'
                }}>
                    <h2 style={{
                        margin: 0,
                        color: 'var(--primary-accent)',
                        fontSize: '1.5rem',
                        fontWeight: '700'
                    }}>
                        📊 Dataset Builder
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-card)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        ✕
                    </button>
                </div>

                {/* Form Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            Question:
                        </label>
                        <textarea
                            value={currentQuestion}
                            onChange={(e) => setCurrentQuestion(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'question')}
                            placeholder="Enter your question..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '0.75rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            Answer:
                        </label>
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, 'answer')}
                            placeholder="Enter the expected answer..."
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '0.75rem',
                                backgroundColor: 'var(--background-card)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* Add Example Button */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <button
                        onClick={addExample}
                        disabled={!currentQuestion.trim() || !currentAnswer.trim()}
                        style={{
                            backgroundColor: 'var(--primary-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: (!currentQuestion.trim() || !currentAnswer.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (!currentQuestion.trim() || !currentAnswer.trim()) ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ➕ Add Example
                    </button>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.5rem'
                    }}>
                        Or press Ctrl+Enter in either field
                    </div>
                </div>

                {/* Examples List */}
                <div
                    className="dataset-builder-examples"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        marginBottom: '1.5rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '1rem',
                        backgroundColor: 'var(--background-dark)',
                        maxHeight: '300px',
                        scrollBehavior: 'smooth'
                    }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <h3 style={{
                        margin: '0 0 1rem 0',
                        color: 'var(--primary-accent)',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                    }}>
                        Examples ({examples.length})
                    </h3>

                    {examples.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            padding: '2rem'
                        }}>
                            No examples added yet. Fill in the question and answer fields above and click "Add Example".
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {examples.map((example, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: 'var(--background-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        padding: '1rem',
                                        position: 'relative'
                                    }}
                                >
                                    <button
                                        onClick={() => removeExample(index)}
                                        style={{
                                            position: 'absolute',
                                            top: '0.5rem',
                                            right: '0.5rem',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--error-color)',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            padding: '0.25rem',
                                            borderRadius: '4px'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        title="Remove example"
                                    >
                                        🗑️
                                    </button>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <strong style={{ color: 'var(--primary-accent)' }}>Q:</strong>
                                        <div style={{
                                            marginTop: '0.25rem',
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--background-dark)',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {example.question}
                                        </div>
                                    </div>

                                    <div>
                                        <strong style={{ color: 'var(--primary-accent)' }}>A:</strong>
                                        <div style={{
                                            marginTop: '0.25rem',
                                            padding: '0.5rem',
                                            backgroundColor: 'var(--background-dark)',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {example.answer}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--background-card)';
                            e.currentTarget.style.borderColor = 'var(--text-secondary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleUseDataset}
                        disabled={examples.length === 0}
                        style={{
                            backgroundColor: examples.length === 0 ? 'var(--border-color)' : 'var(--primary-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: examples.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: examples.length === 0 ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        🚀 Use this Dataset ({examples.length} examples)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatasetBuilder;