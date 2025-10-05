import { useState } from 'react';
import axios from 'axios';
import type { TemplatePreviewState } from '../types/promptAnalyzer';

export const useTemplateOperations = () => {
    const [templatePreviewState, setTemplatePreviewState] = useState<TemplatePreviewState>({
        templatePreviews: {},
        loadingPreviews: {},
        previewErrors: {},
        mergedTemplates: {}
    });
    const [isMergingTemplate, setIsMergingTemplate] = useState<boolean>(false);

    const loadTemplatePreview = async (templateSlug: string) => {
        if (templatePreviewState.templatePreviews[templateSlug] ||
            templatePreviewState.loadingPreviews[templateSlug] ||
            templatePreviewState.previewErrors[templateSlug]) {
            return; // Already loaded, loading, or has error
        }

        setTemplatePreviewState(prev => ({
            ...prev,
            loadingPreviews: { ...prev.loadingPreviews, [templateSlug]: true }
        }));

        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/templates/content/${templateSlug}`);
            const templateData = response.data;

            setTemplatePreviewState(prev => ({
                ...prev,
                templatePreviews: {
                    ...prev.templatePreviews,
                    [templateSlug]: templateData.content || 'No preview available'
                },
                previewErrors: {
                    ...prev.previewErrors,
                    [templateSlug]: undefined
                }
            }));
        } catch (err) {
            console.error(`Failed to load preview for ${templateSlug}:`, err);
            setTemplatePreviewState(prev => ({
                ...prev,
                previewErrors: {
                    ...prev.previewErrors,
                    [templateSlug]: 'Failed to load preview'
                },
                templatePreviews: {
                    ...prev.templatePreviews,
                    [templateSlug]: 'Preview not available'
                }
            }));
        } finally {
            setTemplatePreviewState(prev => ({
                ...prev,
                loadingPreviews: { ...prev.loadingPreviews, [templateSlug]: false }
            }));
        }
    };

    const previewTemplateMerge = async (
        prompt: string,
        templateSlug: string,
        provider: string,
        model: string,
        apiKey: string
    ) => {
        if (!prompt.trim()) {
            throw new Error('Please enter a prompt first.');
        }

        setIsMergingTemplate(true);
        try {
            const formData = new FormData();
            formData.append('user_prompt', prompt);
            formData.append('template_slug', templateSlug);
            formData.append('provider', provider);
            formData.append('model', model);
            formData.append('api_key', apiKey);

            const response = await axios.post('http://127.0.0.1:8000/api/templates/merge', formData);
            const mergedTemplate = response.data.merged_template;

            setTemplatePreviewState(prev => ({
                ...prev,
                mergedTemplates: {
                    ...prev.mergedTemplates,
                    [templateSlug]: mergedTemplate
                },
                previewErrors: {
                    ...prev.previewErrors,
                    [templateSlug]: undefined
                }
            }));

            return mergedTemplate;
        } catch (err) {
            const errorMessage = 'Failed to preview template merge. Please try again.';
            setTemplatePreviewState(prev => ({
                ...prev,
                previewErrors: {
                    ...prev.previewErrors,
                    [templateSlug]: errorMessage
                }
            }));
            throw new Error(errorMessage);
        } finally {
            setIsMergingTemplate(false);
        }
    };

    const clearMergedTemplates = () => {
        setTemplatePreviewState(prev => ({
            ...prev,
            mergedTemplates: {}
        }));
    };

    return {
        templatePreviewState,
        isMergingTemplate,
        loadTemplatePreview,
        previewTemplateMerge,
        clearMergedTemplates
    };
};