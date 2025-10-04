import { useState, useEffect } from 'react';
import axios from 'axios';

// Define the shape of a single pattern object from your API
interface Pattern {
    pattern: string;
    confidence: number;
    evidence: string[];
    description: string;
    category: string;
}

// Define the shape of the entire API response
interface AnalysisResponse {
    patterns: Record<string, Pattern>;
}

const PromptAnalyzer = () => {
    // Add types to your state variables
    const [prompt, setPrompt] = useState<string>("You are an expert. Let's think step by step.");
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!prompt.trim()) {
            setResults(null);
            return;
        }

        setIsLoading(true);
        setError('');

        const handler = setTimeout(() => {
            axios.post<AnalysisResponse>('http://127.0.0.1:8000/api/analyze', { prompt })
                .then(response => {
                    setResults(response.data);
                })
                .catch(err => {
                    setError('Failed to fetch analysis. Make sure the backend is running.');
                    console.error(err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [prompt]);

    // The JSX part remains exactly the same
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Prompt Engineering Studio</h1>
            <div style={styles.editorContainer}>
                <textarea
                    style={styles.textarea}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                />
            </div>
            <div style={styles.resultsContainer}>
                <h2 style={styles.subHeader}>Pattern Analysis</h2>
                {isLoading && <p>Analyzing...</p>}
                {error && <p style={styles.errorText}>{error}</p>}
                {results && !isLoading && (
                    <div style={styles.patternsGrid}>
                        {Object.values(results.patterns).map((p) => (
                            <div key={p.pattern} style={styles.patternCard}>
                                <h3 style={styles.patternTitle}>{p.pattern.replace(/_/g, ' ')}</h3>
                                <p style={styles.patternCategory}>{p.category}</p>
                                <p style={styles.patternDescription}>{p.description}</p>
                                <div style={styles.confidence}>
                                    Confidence: {Math.round(p.confidence * 100)}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// You can define the type for your styles object for better type safety
const styles: Record<string, React.CSSProperties> = {
    container: { fontFamily: 'sans-serif', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
    header: { textAlign: 'center', margin: 0 },
    subHeader: { marginTop: 0 },
    editorContainer: { display: 'flex', flexDirection: 'column' },
    textarea: {
        height: '200px',
        padding: '1rem',
        fontSize: '1rem',
        borderRadius: '8px',
        border: '1px solid #ccc',
        resize: 'vertical'
    },
    resultsContainer: { border: '1px solid #eee', padding: '1rem', borderRadius: '8px' },
    patternsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
    patternCard: { border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', backgroundColor: '#f9f9f9' },
    patternTitle: { textTransform: 'capitalize', margin: '0 0 0.5rem 0', color: '#333' },
    patternCategory: { margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#666', backgroundColor: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' },
    patternDescription: { margin: '0 0 1rem 0', fontSize: '0.9rem' },
    confidence: { fontWeight: 'bold' },
    errorText: { color: 'red' },
};

export default PromptAnalyzer;