import { useState, useEffect } from 'react';
import axios from 'axios';
import type { OptimizationResult, OptimizationStatus, CostEstimation, OptimizationConfig, LLMConfig } from '../types/promptAnalyzer';

export const usePromptOptimization = (llmConfig: LLMConfig) => {
    const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
        metric: 'exact_match',
        maxIterations: 4,
        selectedFile: null,
        showCostEstimation: false
    });
    const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
    const [isEstimatingCost, setIsEstimatingCost] = useState<boolean>(false);
    const [optimizationStatus, setOptimizationStatus] = useState<OptimizationStatus>('idle');
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
    const [optimizationError, setOptimizationError] = useState<string>('');

    // Cost estimation effect
    useEffect(() => {
        if (optimizationConfig.selectedFile &&
            llmConfig.refinerModel &&
            optimizationConfig.showCostEstimation) {
            const timeoutId = setTimeout(() => {
                handleCostEstimation();
            }, 1000); // 1 second delay to avoid excessive API calls

            return () => clearTimeout(timeoutId);
        }
    }, [
        optimizationConfig.selectedFile,
        llmConfig.refinerModel,
        optimizationConfig.maxIterations,
        llmConfig.refinerProvider,
        optimizationConfig.showCostEstimation
    ]);

    const handleCostEstimation = async () => {
        if (!optimizationConfig.selectedFile || !llmConfig.refinerModel) {
            setCostEstimation(null);
            return;
        }

        setIsEstimatingCost(true);
        try {
            const estimationFormData = new FormData();
            estimationFormData.append('dataset', optimizationConfig.selectedFile);
            estimationFormData.append('provider', llmConfig.refinerProvider);
            estimationFormData.append('model', llmConfig.refinerModel);
            estimationFormData.append('max_iterations', optimizationConfig.maxIterations.toString());

            console.log('Estimating cost for:', {
                provider: llmConfig.refinerProvider,
                model: llmConfig.refinerModel,
                maxIterations: optimizationConfig.maxIterations,
                file: optimizationConfig.selectedFile.name
            });

            const response = await axios.post('http://127.0.0.1:8000/api/optimize/estimate', estimationFormData);
            console.log('Cost estimation response:', response.data);
            setCostEstimation(response.data);
        } catch (err) {
            console.error('Cost estimation failed:', err);
            setCostEstimation({
                error: 'Failed to estimate cost',
                total_cost_usd: 0,
                total_examples: 0,
                estimated_prompt_tokens: 0,
                estimated_completion_tokens: 0
            });
        } finally {
            setIsEstimatingCost(false);
        }
    };

    const optimizePrompt = async (prompt: string) => {
        // Reset previous errors on each new attempt
        setOptimizationError('');
        setOptimizationResult(null);
        setOptimizationStatus('idle');

        // Validation checks
        if (!optimizationConfig.selectedFile) {
            setOptimizationError("Please select a dataset file first.");
            setOptimizationStatus('error');
            return;
        }
        if (!llmConfig.refinerModel.trim()) {
            setOptimizationError("Please enter a model name.");
            setOptimizationStatus('error');
            return;
        }

        // Check cost estimation and confirm if expensive (cloud providers)
        if (costEstimation && !costEstimation.error && llmConfig.refinerProvider !== 'ollama' && costEstimation.total_cost_usd > 0.001) {
            const confirmed = window.confirm(
                `This optimization may cost approximately $${costEstimation.total_cost_usd.toFixed(6)}. Do you want to proceed?`
            );
            if (!confirmed) {
                setOptimizationStatus('idle');
                return;
            }
        }

        setOptimizationStatus('optimizing');
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('dataset', optimizationConfig.selectedFile);
        formData.append('provider', llmConfig.refinerProvider);
        formData.append('model', llmConfig.refinerModel);
        formData.append('api_key', llmConfig.refinerApiKey);
        formData.append('metric', optimizationConfig.metric);
        formData.append('max_iterations', optimizationConfig.maxIterations.toString());

        try {
            const response = await axios.post<OptimizationResult>('http://127.0.0.1:8000/api/optimize', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log("Optimization response received:", response.data);

            setOptimizationResult(response.data);
            setOptimizationStatus('success');
        } catch (err: any) {
            const errorDetail = err.response?.data?.detail || "Optimization failed. Check console and backend logs.";
            setOptimizationError(errorDetail);
            setOptimizationStatus('error');
            console.error(err);
        }
    };

    const resetOptimization = () => {
        setOptimizationStatus('idle');
        setOptimizationResult(null);
        setOptimizationError('');
    };

    return {
        optimizationConfig,
        setOptimizationConfig,
        costEstimation,
        isEstimatingCost,
        optimizationStatus,
        optimizationResult,
        optimizationError,
        optimizePrompt,
        handleCostEstimation,
        resetOptimization
    };
};