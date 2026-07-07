'use client'
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {ArrowRight, Clock3, ClipboardPaste, Copy, Crown, Download, ImagePlus, Link2, RefreshCcw, Trash2} from 'lucide-react';
import {useImageGeneration} from '@/hooks/useImageGeneration';
import {useAuth} from '@/lib/auth-context';
import { trackGrowthEvent } from '@/utils/growthAnalytics';
import { appendTrackingParams, readTrackingSource } from '@/utils/trackingSource';
import {
    MODEL_CONFIG,
    ICON_COMPONENTS,
    ASPECT_RATIOS,
    OUTPUT_FORMATS,
} from '@/public/constants/constants';
import { getModelPoints } from '@/utils/pointsSystem';
import type {ModelType} from '@/public/types/type';
import ImagePreview from "@/components/ImagePreview";
interface AIImageGeneratorProps {
    dictionary: any;
    locale: string;
    entrySource?: string;
}

const quickStartLinks = [
    { title: 'Amazon', href: '/amazon-product-image-generator' },
    { title: 'Shopify', href: '/shopify-product-photo-generator' },
    { title: 'Etsy', href: '/etsy-product-photo-ideas' },
    { title: 'TikTok Shop', href: '/tiktok-shop-product-image-generator' },
    { title: 'Instagram', href: '/instagram-product-photo-generator' },
    { title: 'White background', href: '/white-background-product-photo-ai' },
];

const quickScenarioPresets = [
    {
        title: 'Amazon main image',
        prompt: 'Create a premium Amazon main listing photo for a matte black insulated coffee tumbler. Scene: clean white studio background. Use realistic lighting, sharp product detail, clean composition, no text, no watermark, aspect ratio 1:1.',
        aspectRatio: '1:1',
        brandTone: 'Trustworthy and conversion-focused',
        negativePrompt: 'No text, no watermark, no blur, no busy background, no cropped product, no glare',
    },
    {
        title: 'Shopify lifestyle',
        prompt: 'Create a warm Shopify lifestyle product photo for a matte black insulated coffee tumbler. Scene: bright kitchen with natural morning light and simple everyday props. Keep the product clear and commercial, no text, no watermark, aspect ratio 4:5.',
        aspectRatio: '4:5',
        brandTone: 'Warm and aspirational',
        negativePrompt: 'No text, no watermark, no clutter, no dark shadows, no cropped product',
    },
    {
        title: 'TikTok vertical',
        prompt: 'Create a vertical TikTok Shop product image for a matte black insulated coffee tumbler. Scene: high-energy social commerce setting with strong framing and bright light. Keep the product sharp and easy to shop, no text, no watermark, aspect ratio 9:16.',
        aspectRatio: '9:16',
        brandTone: 'Bold and attention-grabbing',
        negativePrompt: 'No text, no watermark, no blur, no clutter, no cropped product, no awkward framing',
    },
    {
        title: 'Etsy handmade',
        prompt: 'Create a cozy Etsy product photo for a handmade ceramic mug. Scene: warm studio desk with soft daylight, artisan props, and natural texture. Keep the product authentic and clearly visible, no text, no watermark, aspect ratio 4:5.',
        aspectRatio: '4:5',
        brandTone: 'Premium and thoughtful',
        negativePrompt: 'No text, no watermark, no harsh flash, no clutter, no distorted ceramic shape',
    },
    {
        title: 'White background',
        prompt: 'Create a clean white background product photo for ecommerce. Product: matte black insulated coffee tumbler. Scene: pure white studio background with soft realistic shadows and commercial lighting. Keep the product centered, no text, no watermark, aspect ratio 1:1.',
        aspectRatio: '1:1',
        brandTone: 'Minimal and clean',
        negativePrompt: 'No text, no watermark, no background props, no shadow mess, no blur, no cropped product',
    },
] as const;

const tonePresets = [
    'Trustworthy and conversion-focused',
    'Warm and aspirational',
    'Bold and attention-grabbing',
    'Premium and thoughtful',
    'Minimal and clean',
] as const;

export const AIImageGenerator: React.FC<AIImageGeneratorProps> = ({dictionary, locale, entrySource: propEntrySource}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const entrySource = propEntrySource || readTrackingSource(searchParams, 'create_page');
    const isAuthReturn = searchParams.get('return_from') === 'auth_success';
    const isPostPurchaseEntry = entrySource === 'pricing_success_page';
    const purchaseEntrySource = isPostPurchaseEntry ? entrySource : null;
    const [copiedShareLink, setCopiedShareLink] = React.useState(false);
    const [copiedCurrentBundle, setCopiedCurrentBundle] = React.useState(false);
    const [copiedCurrentImageUrl, setCopiedCurrentImageUrl] = React.useState(false);
    const [copiedRecentBundleIndex, setCopiedRecentBundleIndex] = React.useState<number | null>(null);
    const promptTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const trackedViewRef = React.useRef(false);
    const trackedEntryRef = React.useRef(false);
    const trackedTrialBridgeRef = React.useRef(false);
    const {
        state,
        updateState,
        handleGenerate,
        handleGenerateFromSetup,
        handleDownload,
        clearRecentGenerations,
        clearGenerationDraft,
    } = useImageGeneration(locale);
    const referenceFileInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleResetGenerationDraft = () => {
        trackGrowthEvent('product_photo_create_reset_draft', {
            entrySource,
            source: 'create_recent_generation',
            target: 'reset_draft',
        });
        clearGenerationDraft();
        setCopiedShareLink(false);
        setCopiedCurrentBundle(false);
        setCopiedCurrentImageUrl(false);
    };

    const handleClearRecentGenerations = () => {
        trackGrowthEvent('product_photo_create_clear_recent', {
            entrySource,
            source: 'create_recent_generation',
            target: 'clear_recent_generations',
        });
        clearRecentGenerations();
        setCopiedRecentBundleIndex(null);
    };

    const handleAuthReturnContinue = () => {
        trackGrowthEvent('product_photo_create_auth_return_continue_click', {
            entrySource,
            source: 'auth_success_return_banner',
            target: 'scroll_to_generate',
        });

        const target = document.getElementById('primary-generate-button');
        if (target) {
            target.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
    };

    const handleDownloadCurrentImage = () => {
        trackGrowthEvent('product_photo_create_download_current', {
            entrySource,
            source: 'create_result_actions',
            target: 'download_image',
        });
        handleDownload();
    };

    const applyReferenceImageFile = React.useCallback((file: File, inputMethod: string) => {
        trackGrowthEvent('product_photo_reference_upload', {
            entrySource,
            source: 'create_reference_picker',
            inputMethod,
            fileType: file.type,
            fileSize: file.size,
        });

        updateState({
            referenceImageName: file.name,
            referenceImageSize: file.size,
        });

        const reader = new FileReader();
        reader.onload = () => {
            updateState({ referenceImagePreview: reader.result as string });
        };
        reader.readAsDataURL(file);
    }, [entrySource, updateState]);

    const handleReferenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            event.target.value = '';
            return;
        }

        applyReferenceImageFile(file, 'upload');
        event.target.value = '';
    };

    const handleReferencePaste = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard?.read) {
            trackGrowthEvent('product_photo_reference_upload', {
                entrySource,
                source: 'create_reference_picker',
                inputMethod: 'clipboard_unsupported',
            });
            return;
        }

        try {
            const items = await navigator.clipboard.read();
            const imageItem = items.find((item) => item.types.some((type) => type.startsWith('image/')));

            if (!imageItem) {
                trackGrowthEvent('product_photo_reference_upload', {
                    entrySource,
                    source: 'create_reference_picker',
                    inputMethod: 'clipboard_empty',
                });
                return;
            }

            const imageType = imageItem.types.find((type) => type.startsWith('image/')) || 'image/png';
            const blob = await imageItem.getType(imageType);
            const fileName = `clipboard-reference.${imageType.split('/')[1] || 'png'}`;
            const file = new File([blob], fileName, { type: imageType });

            applyReferenceImageFile(file, 'clipboard_paste');
        } catch (error) {
            console.error('Failed to paste reference image:', error);
            trackGrowthEvent('product_photo_reference_upload', {
                entrySource,
                source: 'create_reference_picker',
                inputMethod: 'clipboard_failed',
            });
        }
    };

    const clearReferenceImage = () => {
        trackGrowthEvent('product_photo_builder_clear_reference_image', {
            entrySource,
            source: 'create_reference_picker',
            target: 'clear_reference_image',
        });
        updateState({
            referenceImagePreview: null,
            referenceImageName: null,
            referenceImageSize: null,
        });
    };
    
    // Use new Cloudflare auth system
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const isLoggedIn = isAuthenticated;
    const userPoints = user?.points || 0;
    const buildPricingHref = (source: string) => appendTrackingParams(`/${locale}/pricing`, {
        source,
        entry_source: entrySource,
        pricing_source: source,
    });
    const buildAuthHref = (source: string) => appendTrackingParams(`/${locale}/auth`, {
        source,
        entry_source: entrySource,
    });
    const buildHistoryHref = (source: string) => appendTrackingParams(`/${locale}/dashboard`, {
        source,
        entry_source: entrySource,
    });

    // Sync auth state to useImageGeneration
    React.useEffect(() => {
        if (!authLoading) {
            updateState({
                isLoggedIn,
                userPoints,
                userId: user?.id || null
            });
        }
    }, [isLoggedIn, userPoints, user?.id, authLoading, updateState]);

    React.useEffect(() => {
        if (authLoading || (!isAuthReturn && !isPostPurchaseEntry)) {
            return;
        }

        const timer = window.setTimeout(() => {
            promptTextareaRef.current?.focus();
            trackGrowthEvent('product_photo_create_prompt_focus', {
                entrySource,
                source: isPostPurchaseEntry ? 'pricing_success_page' : 'auth_success_page',
                target: 'focus_prompt',
            });
        }, 300);

        return () => window.clearTimeout(timer);
    }, [authLoading, entrySource, isAuthReturn, isPostPurchaseEntry]);

    React.useEffect(() => {
        if (authLoading || trackedViewRef.current) {
            return;
        }

        trackGrowthEvent('product_photo_view', {
            source: entrySource,
            locale,
        });
        trackedViewRef.current = true;
    }, [authLoading, entrySource, locale]);

    React.useEffect(() => {
        if (
            authLoading ||
            trackedTrialBridgeRef.current ||
            isLoggedIn ||
            state.freeGenerationsRemaining > 0
        ) {
            return;
        }

        trackGrowthEvent('product_photo_trial_bridge_view', {
            source: 'create_trial_bridge',
            target: 'trial_limit_reached',
            entrySource,
            remainingFreeGenerations: state.freeGenerationsRemaining,
        });
        trackedTrialBridgeRef.current = true;
    }, [authLoading, entrySource, isLoggedIn, state.freeGenerationsRemaining]);

    React.useEffect(() => {
        if (!isPostPurchaseEntry || authLoading || trackedEntryRef.current) {
            return;
        }

        trackGrowthEvent('product_photo_create_open_create', {
            source: purchaseEntrySource || 'pricing_success_page',
            target: 'open_create',
            entrySource,
        });
        trackedEntryRef.current = true;
    }, [authLoading, entrySource, isPostPurchaseEntry]);

    React.useEffect(() => {
        if (!isAuthReturn) {
            return;
        }

        trackGrowthEvent('product_photo_create_auth_return_view', {
            source: 'auth_success_page',
            target: 'resume_create',
            entrySource,
        });
    }, [entrySource, isAuthReturn]);

    React.useEffect(() => {
        const prompt = searchParams.get('prompt');
        const negativePrompt = searchParams.get('negativePrompt');
        const brandTone = searchParams.get('brandTone');
        const model = searchParams.get('model');
        const aspectRatio = searchParams.get('aspectRatio') || searchParams.get('ratio');
        const outputFormat = searchParams.get('outputFormat') || searchParams.get('format');

        const updates: Record<string, string> = {};

        if (prompt && !state.prompt) {
            updates.prompt = prompt;
        }
        if (negativePrompt && !state.negativePrompt) {
            updates.negativePrompt = negativePrompt;
        }
        if (brandTone && !state.brandTone) {
            updates.brandTone = brandTone;
        }
        if (model) {
            updates.selectedModel = model;
        }
        if (aspectRatio) {
            updates.aspectRatio = aspectRatio;
        }
        if (outputFormat) {
            updates.outputFormat = outputFormat;
        }

        if (Object.keys(updates).length > 0) {
            updateState(updates);
        }
    }, [searchParams, state.brandTone, state.negativePrompt, state.prompt, updateState]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isEditable =
                target?.tagName === 'INPUT' ||
                target?.tagName === 'TEXTAREA' ||
                target?.isContentEditable;

            if (!isEditable || !state.prompt) {
                return;
            }

            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isGenerateBlocked()) {
                event.preventDefault();
                handlePrimaryAction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGenerate, state.prompt, state.selectedModel, state.aspectRatio, state.outputFormat, state.isLoading, authLoading, isLoggedIn, userPoints, state.freeGenerationsRemaining]);

    // Show loading state while auth is loading
    if (authLoading) {
        return (
            <div className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/80">Loading AI Image Generator...</p>
                </div>
            </div>
        );
    }

    const model = state.selectedModel as ModelType;
    const requiredPoints = getModelPoints(model);
    const needsAuthForPremium = !isLoggedIn && model !== 'flux-schnell';
    const needsAuthForTrial = !isLoggedIn && model === 'flux-schnell' && state.freeGenerationsRemaining <= 0;
    const needsPricingForPoints = isLoggedIn && userPoints !== null && userPoints < requiredPoints;
    const shouldBridgeToAuth = needsAuthForPremium || needsAuthForTrial;

    const isGenerateBlocked = (): boolean => Boolean(
        state.isLoading ||
        authLoading ||
        !state.prompt
    );

    const handlePrimaryAction = () => {
        if (needsPricingForPoints) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
            }
            trackGrowthEvent('product_photo_create_open_pricing', {
                entrySource,
                source: 'create_insufficient_points',
                target: 'open_pricing',
            });
            router.push(buildPricingHref('create_insufficient_points'));
            return;
        }

        if (shouldBridgeToAuth) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
            }
            trackGrowthEvent('product_photo_create_open_auth', {
                entrySource,
                source: needsAuthForTrial ? 'create_gate' : 'create_premium_gate',
                target: 'open_auth',
            });
            router.push(buildAuthHref(needsAuthForTrial ? 'create_gate' : 'create_premium_gate'));
            return;
        }

        handleGenerate();
    };

    const getButtonText = (): string => {
        if (state.isLoading || authLoading) {
            return dictionary.imageGenerator.generatingButton;
        }
        
        const model = state.selectedModel as ModelType;
        const requiredPoints = getModelPoints(model);
        
        if (!isLoggedIn) {
            // 未登录用户
            if (model !== 'flux-schnell') {
                return 'Sign up to use it';
            }
            if (state.freeGenerationsRemaining <= 0) {
                return 'Sign up';
            }
            return `🎨 Generate (${state.freeGenerationsRemaining} free)`;
        }
        
        // 登录用户
        if (userPoints !== null && userPoints < requiredPoints) {
            return 'Buy credits';
        }
        
        return dictionary.imageGenerator.generateButton;
    };

    const getButtonHint = (): string | null => {
        if (needsPricingForPoints) {
            return 'Add credits.';
        }

        if (needsAuthForPremium) {
            return 'Sign in to unlock it.';
        }

        if (needsAuthForTrial) {
            return 'Sign up.';
        }

        return null;
    };

    const handleReuseRecentGeneration = (item: {
        prompt: string;
        negativePrompt?: string;
        brandTone?: string;
        generatedImage: string;
        selectedModel: string;
        aspectRatio: string;
        outputFormat: string;
        imageDimensions?: { width: number; height: number } | null;
        pointsConsumed?: number | null;
        usedFreeTier?: boolean | null;
    }) => {
        trackGrowthEvent('product_photo_recent_reuse', {
            entrySource,
            source: 'create_recent_generation',
            target: 'reuse_setup',
            model: item.selectedModel,
            aspectRatio: item.aspectRatio,
        });

        updateState({
            prompt: item.prompt,
            negativePrompt: item.negativePrompt || '',
            brandTone: item.brandTone || '',
            generatedImage: item.generatedImage,
            selectedModel: item.selectedModel as ModelType,
            aspectRatio: item.aspectRatio,
            outputFormat: item.outputFormat,
            imageDimensions: item.imageDimensions || null,
        });
    };

    const handleCopyRecentPrompt = async (prompt: string) => {
        try {
            await navigator.clipboard.writeText(prompt);
            trackGrowthEvent('product_photo_recent_copy_prompt', {
                entrySource,
                source: 'create_recent_generation',
                target: 'copy_prompt',
                promptLength: prompt.trim().length,
            });
        } catch {
            // noop
        }
    };

    const buildShareLink = (item: {
        prompt: string;
        negativePrompt?: string;
        brandTone?: string;
        selectedModel: string;
        aspectRatio: string;
        outputFormat: string;
        pointsConsumed?: number | null;
    }) => {
        const params = new URLSearchParams({
            prompt: item.prompt,
            negativePrompt: item.negativePrompt || '',
            brandTone: item.brandTone || '',
            model: item.selectedModel,
            aspectRatio: item.aspectRatio,
            outputFormat: item.outputFormat,
            source: entrySource,
            entrySource,
        });

        const relativeUrl = `/${locale}/create?${params.toString()}`;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${relativeUrl}`;
        }

        return relativeUrl;
    };

    const copyRecentBundle = async (item: {
        prompt: string;
        negativePrompt?: string;
        brandTone?: string;
        selectedModel: string;
        aspectRatio: string;
        outputFormat: string;
        imageDimensions?: { width: number; height: number } | null;
        generatedImage?: string;
        pointsConsumed?: number | null;
        usedFreeTier?: boolean | null;
    }, index: number) => {
        const bundle = [
            `Entry source: ${entrySource}`,
            `Prompt: ${item.prompt}`,
            item.negativePrompt ? `Negative prompt: ${item.negativePrompt}` : null,
            item.brandTone ? `Brand tone: ${item.brandTone}` : null,
            (item as { referenceImageName?: string | null }).referenceImageName ? `Reference image: ${(item as { referenceImageName?: string | null }).referenceImageName}` : null,
            `Model: ${MODEL_CONFIG[item.selectedModel as keyof typeof MODEL_CONFIG].name}`,
            `Aspect ratio: ${item.aspectRatio}`,
            `Output format: ${item.outputFormat.toUpperCase()}`,
            item.imageDimensions ? `Dimensions: ${item.imageDimensions.width}x${item.imageDimensions.height}` : null,
            typeof item.pointsConsumed === 'number' ? `Points used: ${item.pointsConsumed}` : null,
            item.usedFreeTier ? 'Billing: free tier' : null,
            item.generatedImage ? `Image URL: ${item.generatedImage}` : null,
            `Link: ${buildShareLink(item)}`,
        ].filter(Boolean).join('\n');

        try {
            await navigator.clipboard.writeText(bundle);
            trackGrowthEvent('product_photo_recent_copy_bundle', {
                entrySource,
                source: 'create_recent_generation',
                target: 'copy_bundle',
                resultIndex: index,
                model: item.selectedModel,
                aspectRatio: item.aspectRatio,
                outputFormat: item.outputFormat,
            });
            setCopiedRecentBundleIndex(index);
            window.setTimeout(() => setCopiedRecentBundleIndex(null), 1600);
        } catch {
            setCopiedRecentBundleIndex(null);
        }
    };

    const downloadRecentImage = async (item: {
        prompt: string;
        negativePrompt?: string;
        brandTone?: string;
        generatedImage: string;
        selectedModel: string;
        aspectRatio: string;
        outputFormat: string;
        pointsConsumed?: number | null;
    }, index: number) => {
        try {
            const response = await fetch(item.generatedImage);
            if (!response.ok) {
                throw new Error('Failed to fetch image');
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const promptSlug = (item.prompt || `generated-image-${index + 1}`)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 48);
            const ratioSlug = item.aspectRatio.replace(':', 'x');
            link.download = `${item.selectedModel}-${promptSlug}-${ratioSlug}.${item.outputFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            trackGrowthEvent('product_photo_recent_download', {
                entrySource,
                source: 'create_recent_generation',
                target: 'download_image',
                resultIndex: index,
                model: item.selectedModel,
                aspectRatio: item.aspectRatio,
                outputFormat: item.outputFormat,
            });
        } catch {
            // noop
        }
    };

    const handleCopyCurrentPrompt = async () => {
        try {
            await navigator.clipboard.writeText(state.prompt);
            trackGrowthEvent('product_photo_copy_prompt', {
                entrySource,
                source: 'create_result_actions',
                target: 'copy_prompt',
                promptLength: state.prompt.trim().length,
            });
        } catch {
            // noop
        }
    };

    const handleCopyCurrentBundle = async () => {
        const bundle = [
            `Entry source: ${entrySource}`,
            `Prompt: ${state.prompt}`,
            state.negativePrompt ? `Negative prompt: ${state.negativePrompt}` : null,
            state.brandTone ? `Brand tone: ${state.brandTone}` : null,
            state.referenceImageName ? `Reference image: ${state.referenceImageName}` : null,
            `Model: ${MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].name}`,
            `Aspect ratio: ${state.aspectRatio}`,
            `Output format: ${state.outputFormat.toUpperCase()}`,
            state.imageDimensions ? `Dimensions: ${state.imageDimensions.width}x${state.imageDimensions.height}` : null,
            state.generatedImage ? `Points used: ${getModelPoints(state.selectedModel as ModelType)}` : null,
            state.generatedImage ? `Image URL: ${state.generatedImage}` : null,
            `Link: ${getCurrentShareLink()}`,
        ].filter(Boolean).join('\n');

        try {
            await navigator.clipboard.writeText(bundle);
            trackGrowthEvent('product_photo_copy_bundle', {
                entrySource,
                source: 'create_result_actions',
                target: 'copy_bundle',
                model: state.selectedModel,
                aspectRatio: state.aspectRatio,
                outputFormat: state.outputFormat,
            });
            setCopiedCurrentBundle(true);
            window.setTimeout(() => setCopiedCurrentBundle(false), 1600);
        } catch {
            setCopiedCurrentBundle(false);
        }
    };

    const getCurrentShareLink = () => {
        const params = new URLSearchParams({
            prompt: state.prompt,
            negativePrompt: state.negativePrompt,
            brandTone: state.brandTone,
            model: state.selectedModel,
            aspectRatio: state.aspectRatio,
            outputFormat: state.outputFormat,
            source: entrySource,
            entrySource,
        });

        const relativeUrl = `/${locale}/create?${params.toString()}`;
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${relativeUrl}`;
        }

        return relativeUrl;
    };

    const handleCopyCurrentLink = async () => {
        try {
            await navigator.clipboard.writeText(getCurrentShareLink());
            trackGrowthEvent('product_photo_copy_share_link', {
                entrySource,
                source: 'create_result_actions',
                target: 'copy_share_link',
                model: state.selectedModel,
                aspectRatio: state.aspectRatio,
            });
            setCopiedShareLink(true);
            window.setTimeout(() => setCopiedShareLink(false), 1600);
        } catch {
            setCopiedShareLink(false);
        }
    };

    const handleCopyCurrentImageUrl = async () => {
        if (!state.generatedImage) {
            return;
        }

        try {
            await navigator.clipboard.writeText(state.generatedImage);
            trackGrowthEvent('product_photo_copy_image_url', {
                entrySource,
                source: 'create_result_actions',
                target: 'copy_image_url',
                model: state.selectedModel,
                aspectRatio: state.aspectRatio,
                outputFormat: state.outputFormat,
            });
            setCopiedCurrentImageUrl(true);
            window.setTimeout(() => setCopiedCurrentImageUrl(false), 1600);
        } catch {
            setCopiedCurrentImageUrl(false);
        }
    };

    const handleCopyCurrentSetup = async () => {
        const setup = [
            `Entry source: ${entrySource}`,
            `Prompt: ${state.prompt}`,
            state.negativePrompt ? `Negative prompt: ${state.negativePrompt}` : null,
            state.brandTone ? `Brand tone: ${state.brandTone}` : null,
            state.referenceImageName ? `Reference image: ${state.referenceImageName}` : null,
            `Model: ${MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].name}`,
            `Aspect ratio: ${state.aspectRatio}`,
            state.imageDimensions ? `Canvas: ${state.imageDimensions.width} × ${state.imageDimensions.height}` : null,
            `Format: ${state.outputFormat.toUpperCase()}`,
            `Points cost: ${getModelPoints(state.selectedModel as ModelType)}`,
        ].filter(Boolean).join('\n');

        try {
            await navigator.clipboard.writeText(setup);
            trackGrowthEvent('product_photo_create_copy_setup', {
                entrySource,
                source: 'create_setup',
                target: 'copy_setup',
            });
        } catch {
            // noop
        }
    };

    const handleCopyRecentSetups = async () => {
        if (state.recentGenerations.length === 0) {
            return;
        }

        const recentSetups = state.recentGenerations.slice(0, 3).map((item, index) => [
            `Entry source: ${entrySource}`,
            `${index + 1}. ${item.prompt}`,
            item.negativePrompt ? `Negative prompt: ${item.negativePrompt}` : null,
            item.brandTone ? `Brand tone: ${item.brandTone}` : null,
            item.referenceImageName ? `Reference image: ${item.referenceImageName}` : null,
            `Model: ${MODEL_CONFIG[item.selectedModel as keyof typeof MODEL_CONFIG].name}`,
            `Aspect ratio: ${item.aspectRatio}`,
            item.imageDimensions ? `Canvas: ${item.imageDimensions.width} × ${item.imageDimensions.height}` : null,
            `Format: ${item.outputFormat.toUpperCase()}`,
            typeof item.pointsConsumed === 'number' ? `Points used: ${item.pointsConsumed}` : null,
            item.generatedImage ? `Image URL: ${item.generatedImage}` : null,
            `Link: ${buildShareLink(item)}`,
        ].filter(Boolean).join('\n')).join('\n\n');

        try {
            await navigator.clipboard.writeText(recentSetups);
            trackGrowthEvent('product_photo_recent_copy_packages', {
                entrySource,
                source: 'create_recent_generation',
                target: 'copy_recent_packages',
                count: Math.min(3, state.recentGenerations.length),
            });
        } catch {
            // noop
        }
    };

    const handleGenerateAgainFromRecent = async (item: {
        prompt: string;
        negativePrompt?: string;
        brandTone?: string;
        referenceImagePreview?: string | null;
        referenceImageName?: string | null;
        referenceImageSize?: number | null;
        selectedModel: string;
        aspectRatio: string;
        outputFormat: string;
    }, index: number) => {
        trackGrowthEvent('product_photo_recent_generate_again', {
            entrySource,
            source: 'create_recent_generation',
            target: 'generate_again',
            resultIndex: index,
            model: item.selectedModel,
            aspectRatio: item.aspectRatio,
            outputFormat: item.outputFormat,
        });

        await handleGenerateFromSetup({
            prompt: item.prompt,
            negativePrompt: item.negativePrompt || '',
            brandTone: item.brandTone || '',
            selectedModel: item.selectedModel,
            aspectRatio: item.aspectRatio,
            outputFormat: item.outputFormat,
            referenceImagePreview: item.referenceImagePreview || null,
            referenceImageName: item.referenceImageName || null,
            referenceImageSize: item.referenceImageSize || null,
        });
    };

    const applyQuickScenarioPreset = (preset: typeof quickScenarioPresets[number]) => {
        updateState({
            prompt: preset.prompt,
            selectedModel: 'flux-schnell',
            aspectRatio: preset.aspectRatio,
            outputFormat: 'jpg',
            negativePrompt: preset.negativePrompt,
            brandTone: preset.brandTone,
        });

        trackGrowthEvent('product_photo_scenario_preset', {
            entrySource,
            source: 'create_quick_preset',
            preset: preset.title,
            aspectRatio: preset.aspectRatio,
            brandTone: preset.brandTone,
        });
    };

    return (
        <div
            className="h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 pb-8 lg:overflow-hidden relative">
            <div className="absolute inset-0 bg-black opacity-50"/>
            <div
                className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>

            <div className="container mx-auto z-10 max-w-7xl h-full flex flex-col lg:overflow-hidden overflow-auto"
                 style={{paddingTop: '2rem', paddingBottom: '2rem'}}>
                {/* Header */}
                <div className="pb-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold animate-fade-in-down mb-3">
                        {dictionary.imageGenerator.pageTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-white/80">
                        {dictionary.imageGenerator.description}
                    </p>
                    {isPostPurchaseEntry && (
                        <div className="mx-auto mt-5 max-w-2xl rounded-lg border border-emerald-300/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-50">
                            Your new points are ready. Paste a prompt below, or start from a preset, and generate right away.
                        </div>
                    )}
                    {isAuthReturn && (
                        <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
                            <div className="flex items-start justify-between gap-3">
                                <p className="font-medium text-white">
                                    You&apos;re back from sign up.
                                </p>
                                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                                    Draft kept
                                </span>
                            </div>
                            <p className="mt-1 leading-6 text-white/75">
                                Your prompt, model choice, and reference image are still loaded. Continue from the same setup whenever you&apos;re ready.
                            </p>
                            <button
                                onClick={handleAuthReturnContinue}
                                className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                            >
                                Continue generating
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                    {(state.referenceImagePreview || state.referenceImageName) && (
                        <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-left">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                    Reference image carried over
                                </p>
                                {state.referenceImageName && (
                                    <span className="max-w-[16rem] truncate text-xs text-white/70">
                                        {state.referenceImageName}
                                    </span>
                                )}
                            </div>
                            {state.referenceImagePreview && (
                                <div className="mt-3 flex items-start gap-3">
                                    <img
                                        src={state.referenceImagePreview}
                                        alt="Reference image preview"
                                        className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                                    />
                                    <p className="text-sm leading-6 text-white/80">
                                        The uploaded reference is now part of the draft and the next prompt will mention it when you generate.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                            Quick start presets
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {quickScenarioPresets.map((preset) => (
                                <button
                                    key={preset.title}
                                    onClick={() => applyQuickScenarioPreset(preset)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:border-white/30 hover:bg-white/10"
                                >
                                    {preset.title}
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                            Quick start by scenario
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {quickStartLinks.map((item) => (
                                <Link
                                    key={item.title}
                                    href={appendTrackingParams(`/${locale}${item.href}`, {
                                        source: entrySource,
                                        entry_source: entrySource,
                                    })}
                                    onClick={() => trackGrowthEvent('product_photo_create_quick_start', {
                                        entrySource,
                                        source: 'create_quick_start',
                                        step: item.title,
                                    })}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:border-white/30 hover:bg-white/10"
                                >
                                    {item.title}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content - Left-Right Layout */}
                <div className="flex-grow flex flex-col lg:flex-row gap-6 lg:min-h-0">
                    {/* Left Column - Controls */}
                    <div className="w-full lg:w-1/2 space-y-4 border rounded-lg border-gray-100 p-4 lg:p-6">{/* 移除 overflow-y-auto */}
                        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                        Reference image
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-white/70">
                                        Upload or paste a product image first. The draft keeps it attached when you move into generation.
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    state.referenceImagePreview || state.referenceImageName
                                        ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                                        : 'border-white/10 bg-white/5 text-white/60'
                                }`}>
                                    {state.referenceImagePreview || state.referenceImageName ? 'Attached' : 'Optional'}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => referenceFileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                                >
                                    <ImagePlus className="h-3.5 w-3.5" />
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReferencePaste}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                                >
                                    <ClipboardPaste className="h-3.5 w-3.5" />
                                    Paste
                                </button>
                                {(state.referenceImagePreview || state.referenceImageName) && (
                                    <button
                                        type="button"
                                        onClick={clearReferenceImage}
                                        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Clear
                                    </button>
                                )}
                            </div>

                            <input
                                ref={referenceFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleReferenceUpload}
                            />

                            {(state.referenceImagePreview || state.referenceImageName) && (
                                <div className="flex items-start gap-3 rounded-md border border-white/10 bg-black/20 p-3">
                                    {state.referenceImagePreview ? (
                                        <img
                                            src={state.referenceImagePreview}
                                            alt="Reference image preview"
                                            className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border border-dashed border-white/15 text-white/50">
                                            <ImagePlus className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-white">
                                            {state.referenceImageName || 'Reference image attached'}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-white/60">
                                            {state.referenceImageSize ? `${(state.referenceImageSize / 1024).toFixed(1)} KB` : 'Ready for the next prompt.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-1.5">
                            <h1 className="text-2xl lg:text-3xl font-medium text-white/90">
                                {dictionary.imageGenerator.title}
                            </h1>
                            <label className="text-sm font-medium text-white/90">
                                {dictionary.imageGenerator.promptLabel}
                            </label>
                            <textarea
                                ref={promptTextareaRef}
                                value={state.prompt}
                                onChange={(e) => updateState({prompt: e.target.value})}
                                placeholder={dictionary.imageGenerator.promptPlaceholder}
                                className="w-full h-64 p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 resize-none"
                            />
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    Exclusions
                                </label>
                                <textarea
                                    value={state.negativePrompt}
                                    onChange={(e) => updateState({negativePrompt: e.target.value})}
                                    placeholder="No text, no watermark, no blur, no extra hands, no distorted label, no cropped product"
                                    className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 resize-none"
                                />
                                <p className="text-xs leading-5 text-white/50">
                                    Optional. Keeps the product clean and centered.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    Tone
                                </label>
                                <input
                                    value={state.brandTone}
                                    onChange={(e) => updateState({brandTone: e.target.value})}
                                    placeholder="Trustworthy and conversion-focused"
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50"
                                />
                                <p className="text-xs leading-5 text-white/50">
                                    Optional. Keeps prompt aligned.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Tones</p>
                                <div className="flex flex-wrap gap-2">
                                    {tonePresets.map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => {
                                                updateState({brandTone: preset});
                                                trackGrowthEvent('product_photo_tone_preset', {
                                                    entrySource,
                                                    source: 'create_tone_preset',
                                                    tone: preset,
                                                });
                                            }}
                                            className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                                                state.brandTone === preset
                                                    ? 'border-indigo-300 bg-indigo-500/20 text-white'
                                                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Model Selection */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-white/90">
                                {dictionary.imageGenerator.modelLabel}
                            </label>
                            <div className="relative">
                                <select
                                    value={state.selectedModel}
                                    onChange={(e) => updateState({selectedModel: e.target.value as ModelType})}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {Object.entries(MODEL_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}
                                                className={config.isPremium ? 'text-yellow-300' : ''}>
                                            {config.name} • {config.points} {config.points === 1 ? dictionary.imageGenerator.modelPoints : dictionary.imageGenerator.modelPoints + 's'}
                                            {config.isPremium ? ` (${dictionary.imageGenerator.modelPremium})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="mt-2 text-xs text-white/60 flex items-center gap-2">
                                    {React.createElement(
                                        ICON_COMPONENTS[MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].icon as keyof typeof ICON_COMPONENTS],
                                        {
                                            className: `w-4 h-4 ${MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].isPremium ? 'text-yellow-300' : 'text-white/60'}`
                                        }
                                    )}
                                    <span>{MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].description}</span>
                                </div>
                            </div>
                        </div>

                        {/* Aspect Ratio and Output Format */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.imageGenerator.aspectRatioLabel}
                                </label>
                                <select
                                    value={state.aspectRatio}
                                    onChange={(e) => {
                                        const nextAspectRatio = e.target.value;
                                        updateState({aspectRatio: nextAspectRatio});
                                        trackGrowthEvent('product_photo_aspect_ratio_change', {
                                            entrySource,
                                            source: 'create_canvas_settings',
                                            aspectRatio: nextAspectRatio,
                                            model: state.selectedModel,
                                        });
                                    }}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {ASPECT_RATIOS.map(ratio => (
                                        <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-white/50">
                                    Canvas size: {state.imageDimensions ? `${state.imageDimensions.width} × ${state.imageDimensions.height}` : 'auto'}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/90">
                                    {dictionary.imageGenerator.outputFormatLabel}
                                </label>
                                <select
                                    value={state.outputFormat}
                                    onChange={(e) => {
                                        const nextOutputFormat = e.target.value;
                                        updateState({outputFormat: nextOutputFormat});
                                        trackGrowthEvent('product_photo_output_format_change', {
                                            entrySource,
                                            source: 'create_canvas_settings',
                                            outputFormat: nextOutputFormat,
                                            model: state.selectedModel,
                                        });
                                    }}
                                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    {OUTPUT_FORMATS.filter(format => {
                                        if (state.selectedModel === 'flux-1.1-pro-ultra') {
                                            return ['jpg', 'png'].includes(format.value);
                                        }
                                        return true;
                                    }).map(format => (
                                        <option key={format.value} value={format.value}>{format.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            id="primary-generate-button"
                            onClick={() => {
                                trackGrowthEvent('product_photo_create_generate_click', {
                                    source: 'create_generate',
                                    entrySource,
                                    postPurchase: isPostPurchaseEntry,
                                    model: state.selectedModel,
                                    aspectRatio: state.aspectRatio,
                                    outputFormat: state.outputFormat,
                                    pointsRequired: getModelPoints(state.selectedModel),
                                    promptLength: state.prompt.trim().length,
                                    hasNegativePrompt: Boolean(state.negativePrompt.trim()),
                                    hasBrandTone: Boolean(state.brandTone.trim()),
                                });
                                handlePrimaryAction();
                            }}
                            disabled={isGenerateBlocked()}
                            className="w-full py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600 disabled:bg-white/50 disabled:text-indigo-400 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            {state.isLoading && (
                                <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></div>
                            )}
                            {getButtonText()}
                            {MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].isPremium &&
                                (needsAuthForPremium || needsPricingForPoints) && (
                                <Crown className="w-4 h-4 text-indigo-400"/>
                            )}
                        </button>
                        <p className="text-center text-xs text-white/60">
                            Ctrl/Cmd + Enter to generate
                        </p>
                        {getButtonHint() && (
                            <p className="text-center text-xs leading-5 text-white/55">
                                {getButtonHint()}
                            </p>
                        )}

                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                    Setup
                                </p>
                                <button
                                    onClick={handleCopyCurrentSetup}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Copy
                                </button>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm text-white/85">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Model</span>
                                    <span className="text-right">{MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG].name}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Size</span>
                                    <span className="text-right">
                                        {state.imageDimensions ? `${state.imageDimensions.width} × ${state.imageDimensions.height}` : state.aspectRatio}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Format</span>
                                    <span className="text-right">{state.outputFormat.toUpperCase()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Excl.</span>
                                    <span className="max-w-[16rem] truncate text-right">
                                        {state.negativePrompt ? state.negativePrompt : 'None set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Tone</span>
                                    <span className="max-w-[16rem] truncate text-right">
                                        {state.brandTone ? state.brandTone : 'None set'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/60">Cost</span>
                                    <span className="text-right">{getModelPoints(state.selectedModel)} pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {state.error && (
                            <div className="text-red-300 px-4 py-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <p className="font-medium mb-1">⚠️ Error</p>
                                <p className="text-sm">{state.error || dictionary.imageGenerator.error}</p>
                            </div>
                        )}
                        
                        {/* Credits/Points Display - 简化版 */}
                        <div className="text-indigo-200 px-3 py-2 bg-indigo-500/10 rounded-lg">
                            {authLoading ? (
                                <p className="text-sm">Loading...</p>
                            ) : isLoggedIn ? (
                                // 登录用户：显示积分
                                <div className="space-y-1">
                                    <p className="flex items-center justify-between text-sm">
                                        <span className="truncate">
                                            💎 {dictionary.imageGenerator.points}: {userPoints || 0}
                                        </span>
                                        <span className="text-xs opacity-75 ml-2 flex-shrink-0">
                                            ({getModelPoints(state.selectedModel)} pts)
                                        </span>
                                    </p>
                                    {userPoints !== null && userPoints < getModelPoints(state.selectedModel) && (
                                        <p className="mt-2 text-yellow-300 text-xs break-words">
                                            ⚠️ {dictionary.imageGenerator.insufficientPoints}
                                        <Link
                                            href={buildPricingHref('create_insufficient_points')}
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                                                }
                                                trackGrowthEvent('product_photo_create_open_pricing', {
                                                    entrySource,
                                                    source: 'create_insufficient_points',
                                                    target: 'open_pricing',
                                                });
                                            }}
                                            className="ml-1 underline hover:text-white font-medium"
                                        >
                                            {dictionary.imageGenerator.purchasePoints}
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                // 未登录用户：只显示免费额度（注册激励移到右侧）
                                <div className="space-y-1">
                                    <p className="flex items-center justify-between text-sm">
                                        <span className="truncate">
                                            🎁 Free: {state.freeGenerationsRemaining} / 1
                                        </span>
                                    </p>
                                    {state.freeGenerationsRemaining > 0 ? (
                                        <p className="text-xs text-green-300">
                                            ✨ Free to try.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-yellow-300">
                                            ⏰ Daily limit reached.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        {!authLoading && !isLoggedIn && state.freeGenerationsRemaining === 0 && (
                            <div className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-4 text-amber-50">
                                <p className="text-sm font-semibold">Free used up.</p>
                                <p className="mt-1 text-xs leading-5 text-amber-100/80">
                                    Keep draft, get credits.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Link
                                        href={buildAuthHref('create_gate')}
                                        onClick={() => trackGrowthEvent('product_photo_create_open_auth', {
                                            entrySource,
                                            source: 'create_gate',
                                            target: 'open_auth',
                                        })}
                                        className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                                    >
                                        Sign up
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                    <Link
                                        href={buildPricingHref('create_insufficient_points')}
                                        onClick={() => trackGrowthEvent('product_photo_create_open_pricing', {
                                            entrySource,
                                            source: 'create_insufficient_points',
                                            target: 'open_pricing',
                                        })}
                                        className="inline-flex items-center gap-2 rounded-md border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-50 transition hover:bg-amber-400/10"
                                    >
                                        Buy credits
                                        <Crown className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Image Preview */}
                    <div className="w-full lg:w-1/2 h-full lg:overflow-auto border rounded-lg border-gray-200 p-6 flex flex-col relative">
                        <ImagePreview
                            isLoading={state.isLoading}
                            generatedImage={state.generatedImage}
                            aspectRatio={state.aspectRatio}
                            selectedModel={state.selectedModel as any}
                            modelConfig={MODEL_CONFIG[state.selectedModel as keyof typeof MODEL_CONFIG]}
                            outputFormat={state.outputFormat}
                            onDownload={handleDownloadCurrentImage}
                            imageDimensions={state.imageDimensions}
                            dictionary={dictionary}
                        />

                        {state.generatedImage && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                                <button
                                    onClick={handleCopyCurrentPrompt}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    Prompt
                                </button>
                                <button
                                    onClick={handleCopyCurrentBundle}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    {copiedCurrentBundle ? 'Copied' : 'Setup'}
                                </button>
                                <button
                                    onClick={handleCopyCurrentImageUrl}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {copiedCurrentImageUrl ? 'Copied' : 'URL'}
                                </button>
                                <button
                                    onClick={handleDownloadCurrentImage}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download
                                </button>
                                <button
                                    onClick={handleCopyCurrentLink}
                                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Link2 className="h-3.5 w-3.5" />
                                    {copiedShareLink ? 'Copied' : 'Share'}
                                </button>
                                <Link
                                    href={buildPricingHref('create_result_actions')}
                                    onClick={() => trackGrowthEvent('product_photo_create_more_credits', {
                                        entrySource,
                                        source: 'create_result_actions',
                                        target: 'open_pricing',
                                    })}
                                    className="inline-flex items-center gap-2 rounded-md border border-amber-300/20 bg-amber-400/10 px-2.5 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-400/15"
                                >
                                    <Crown className="h-3.5 w-3.5" />
                                    Credits
                                </Link>
                                {isLoggedIn && (
                                    <Link
                                        href={buildHistoryHref('create_result_actions')}
                                        onClick={() => trackGrowthEvent('product_photo_create_open_history', {
                                            entrySource,
                                            source: 'create_result_actions',
                                            target: 'open_history',
                                        })}
                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                >
                                    <Clock3 className="h-3.5 w-3.5" />
                                    History
                                </Link>
                                )}
                            </div>
                        )}

                        {state.recentGenerations.length > 0 && (
                            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                                <div className="mb-2.5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                                        <Clock3 className="h-4 w-4" />
                                        Recent
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {isLoggedIn && (
                                            <Link
                                                href={buildHistoryHref('create_recent_generation')}
                                                onClick={() => trackGrowthEvent('product_photo_create_open_history', {
                                                    entrySource,
                                                    source: 'create_recent_generation',
                                                    target: 'open_history',
                                                })}
                                                className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                            >
                                                <Clock3 className="h-3.5 w-3.5" />
                                                History
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleCopyRecentSetups}
                                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Setups
                                        </button>
                                        <button
                                            onClick={handleResetGenerationDraft}
                                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                        >
                                            <RefreshCcw className="h-3.5 w-3.5" />
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleClearRecentGenerations}
                                            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-2.5">
                                    {state.recentGenerations.slice(0, 3).map((item, index) => (
                                        <div key={`${item.createdAt}-${index}`} className="flex gap-2.5 rounded-lg border border-white/10 bg-black/20 p-2.5">
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white/5">
                                                {item.generatedImage ? (
                                                    <img
                                                        src={item.generatedImage}
                                                        alt={item.prompt}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-xs leading-5 text-white/80">
                                                    {item.prompt}
                                                </p>
                                                {item.negativePrompt ? (
                                                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                                                        Excl.: {item.negativePrompt}
                                                    </p>
                                                ) : null}
                                                {item.brandTone ? (
                                                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/45">
                                                        Tone: {item.brandTone}
                                                    </p>
                                                ) : null}
                                                <p className="mt-1 text-[11px] text-white/50">
                                                    {item.selectedModel} · {item.aspectRatio}
                                                    {item.imageDimensions ? ` · ${item.imageDimensions.width}×${item.imageDimensions.height}` : ''}
                                                    · {item.outputFormat.toUpperCase()}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/55">
                                                    {typeof item.pointsConsumed === 'number' ? (
                                                        <span>Pts: {item.pointsConsumed}</span>
                                                    ) : null}
                                                    {item.usedFreeTier ? (
                                                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-emerald-200">
                                                            Free
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    <button
                                                        onClick={() => handleReuseRecentGeneration(item)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                                    >
                                                        <RefreshCcw className="h-3.5 w-3.5" />
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => handleGenerateAgainFromRecent(item, index)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                                    >
                                                        <ArrowRight className="h-3.5 w-3.5" />
                                                        Regenerate
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopyRecentPrompt(item.prompt)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        Prompt
                                                    </button>
                                                    <button
                                                        onClick={() => copyRecentBundle(item, index)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                                    >
                                                        <Copy className="h-3.5 w-3.5" />
                                                        {copiedRecentBundleIndex === index ? 'Copied' : 'Copy'}
                                                    </button>
                                                    <button
                                                        onClick={() => downloadRecentImage(item, index)}
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                                                    >
                                                        <Download className="h-3.5 w-3.5" />
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 浮动注册激励卡片 - 仅未登录用户显示 */}
                        {!isLoggedIn && !authLoading && (
                            <div className="absolute bottom-6 right-6 max-w-xs animate-fade-in">
                                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-2xl p-4 border-2 border-white/20 backdrop-blur-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🎁</span>
                                            <h3 className="text-white font-bold text-base">New User Bonus</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">✨</span>
                                            <span>3 bonus credits instantly</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">🚀</span>
                                            <span>Access premium models</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/90 text-sm">
                                            <span className="text-yellow-300">💾</span>
                                            <span>Save your history</span>
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        href={buildAuthHref('create_gate')}
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                                            }
                                            trackGrowthEvent('product_photo_create_open_auth', {
                                                entrySource,
                                                source: 'create_gate',
                                                target: 'open_auth',
                                            });
                                        }}
                                        className="block w-full py-2.5 px-4 bg-white text-purple-600 text-center rounded-lg font-bold hover:bg-purple-50 transition-all transform hover:scale-105 shadow-lg text-sm"
                                    >
                                        Sign Up Free →
                                    </Link>
                                    
                                    <p className="text-white/70 text-xs text-center mt-2">
                                        No credit card required
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
