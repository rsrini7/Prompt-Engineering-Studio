import { useState, useEffect } from 'react';
import axios from 'axios';

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
}

const PromptAnalyzer = () => {
    const [prompt, setPrompt] = useState<string>("You are an expert. Let's think step by step.");
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]); // NEW: State for suggestions
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (!prompt.trim()) {
            setResults(null);
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestions([]);

        const handler = setTimeout(() => {
            // First API call to analyze the prompt
            axios.post<AnalysisResponse>('http://127.0.0.1:8000/api/analyze', { prompt })
                .then(response => {
                    const analysisResults = response.data;
                    setResults(analysisResults);

                    if (analysisResults && Object.keys(analysisResults.patterns).length > 0) {
                        return axios.post('http://127.0.0.1:8000/api/templates/suggest', analysisResults);
                    }
                })
                .then(suggestionResponse => {
                    // This block runs if the suggestion call was made and was successful
                    if (suggestionResponse) {
                        setSuggestions(suggestionResponse.data.suggestions);
                    }
                })
                .catch(err => {
                    setError('Failed to fetch data. Make sure the backend is running.');
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

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Prompt Engineering Studio</h1>
            <div style={styles.mainGrid}>
                <div style={styles.editorContainer}>
                    <h2 style={styles.subHeader}>Your Prompt</h2>
                    <textarea
                        style={styles.textarea}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                    />
                </div>
                <div style={styles.analysisColumn}>
                    <div style={styles.resultsContainer}>
                        <h2 style={styles.subHeader}>Pattern Analysis</h2>
                        {isLoading && <p>Analyzing...</p>}
                        {error && <p style={styles.errorText}>{error}</p>}
                        {results && !isLoading && Object.keys(results.patterns).length > 0 && (
                            <div style={styles.patternsGrid}>
                                {Object.values(results.patterns).map((p) => (
                                    <div key={p.pattern} style={styles.patternCard}>
                                        <h3 style={styles.patternTitle}>{p.pattern.replace(/_/g, ' ')}</h3>
                                        <p style={styles.patternCategory}>{p.category}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={styles.resultsContainer}>
                        <h2 style={styles.subHeader}>💡 Template Suggestions</h2>
                        {isLoading && <p>Loading suggestions...</p>}
                        {suggestions.length > 0 && !isLoading && (
                            <div style={styles.suggestionsList}>
                                {suggestions.map((s) => (
                                    <div key={s.name} style={styles.suggestionCard}>
                                        <span style={styles.suggestionName}>{s.name}</span>
                                        <span style={styles.suggestionScore}>Match: {s.score}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && !error && results && suggestions.length === 0 && <p>No template suggestions for this prompt.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


const styles: Record<string, React.CSSProperties> = {
    container: { fontFamily: 'sans-serif', padding: '2rem' },
    header: { textAlign: 'center', marginBottom: '2rem' },
    subHeader: { marginTop: 0, color: '#444' },
    mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' },
    editorContainer: { display: 'flex', flexDirection: 'column' },
    textarea: {
        flexGrow: 1,
        padding: '1rem',
        fontSize: '1rem',
        borderRadius: '8px',
        border: '1px solid #ccc',
        resize: 'none'
    },
    analysisColumn: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    resultsContainer: { border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', backgroundColor: '#fafafa' },
    errorText: { color: 'red' },
    patternsGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
    patternCard: { border: '1px solid #ddd', padding: '0.3rem 0.8rem', borderRadius: '16px', backgroundColor: '#fff' },
    patternTitle: { textTransform: 'capitalize', margin: '0', fontSize: '0.9rem' },
    patternCategory: { margin: 0, fontSize: '0.8rem', color: '#666' },
    suggestionsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    suggestionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ddd', padding: '0.8rem', borderRadius: '8px', backgroundColor: '#fff' },
    suggestionName: { fontWeight: 'bold', color: '#007acc' },
    suggestionScore: { fontSize: '0.9rem', color: '#333', backgroundColor: '#eef7ff', padding: '0.2rem 0.5rem', borderRadius: '4px' },
};

export default PromptAnalyzer;