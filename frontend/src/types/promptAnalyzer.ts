// Type definitions for PromptAnalyzer components

export interface Pattern {
    pattern: string;
    confidence: number;
    evidence: string[];
    description: string;
    category: string;
}

export interface AnalysisResponse {
    patterns: Record<string, Pattern>;
}

export interface TemplateSuggestion {
    name: string;
    score: number;
    content?: string;
    variables?: string[];
}

export interface OptimizationResult {
    original_prompt: string;
    optimized_prompt: string;
}

export type OptimizationStatus = 'idle' | 'optimizing' | 'success' | 'error';

export type AnalysisTab = 'analyze' | 'optimize';

export interface CostEstimation {
    error?: string;
    total_cost_usd: number;
    total_examples: number;
    estimated_prompt_tokens: number;
    estimated_completion_tokens: number;
    max_iterations?: number;
}

export interface TemplatePreviewState {
    templatePreviews: Record<string, string>;
    loadingPreviews: Record<string, boolean>;
    previewErrors: Record<string, string | undefined>;
    mergedTemplates: Record<string, string>;
}

export interface LLMConfig {
    useLlmRefiner: boolean;
    refinerProvider: string;
    refinerModel: string;
    refinerApiKey: string;
}

export interface OptimizationConfig {
    metric: string;
    maxIterations: number;
    selectedFile: File | null;
    showCostEstimation: boolean;
}