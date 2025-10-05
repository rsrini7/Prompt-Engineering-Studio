import { useState, useEffect } from 'react';
import axios from 'axios';
import type { AnalysisResponse, TemplateSuggestion, LLMConfig } from '../types/promptAnalyzer';

export const usePromptAnalysis = (llmConfig: LLMConfig) => {
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const analyzePrompt = async (prompt: string) => {
        if (!prompt.trim()) {
            setError('Please enter a prompt first.');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuggestions([]);

        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('use_llm_refiner', llmConfig.useLlmRefiner.toString());
            formData.append('llm_provider', llmConfig.refinerProvider);
            formData.append('llm_model', llmConfig.refinerModel);
            formData.append('llm_api_key', llmConfig.refinerApiKey);

            const response = await axios.post<AnalysisResponse>('http://127.0.0.1:8000/api/analyze', formData);
            const analysisResults = response.data;
            setResults(analysisResults);

            if (analysisResults && Object.keys(analysisResults.patterns).length > 0) {
                const suggestionResponse = await axios.post('http://127.0.0.1:8000/api/templates/suggest', analysisResults);
                setSuggestions(suggestionResponse.data.suggestions);
            }
        } catch (err) {
            setError('Failed to fetch data. Make sure the backend is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = () => {
        setResults(null);
        setSuggestions([]);
        setError('');
    };

    // Clear results when LLM refiner settings change
    useEffect(() => {
        if (results || suggestions.length > 0) {
            clearResults();
        }
    }, [llmConfig.useLlmRefiner, llmConfig.refinerProvider, llmConfig.refinerModel, llmConfig.refinerApiKey]);

    return {
        results,
        suggestions,
        isLoading,
        error,
        analyzePrompt,
        clearResults
    };
};