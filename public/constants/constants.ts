// constants.ts
import {Zap, Star, Crown, Sparkles, ThumbsUp} from 'lucide-react';
import {ModelType, ModelConfig, IconName, AspectRatio, OutputFormat} from '../types/type';

export const MAX_DAILY_GENERATIONS = 3;

export const MODEL_CONFIG: Record<ModelType, ModelConfig> = {
    'flux-1.1-pro-ultra': {
        name: 'Flux 1.1 Pro Ultra',
        points: 3,
        description: 'Higher Resolution, No Compromise in Speed',
        icon: 'ThumbsUp',
        isPremium: false,
        processingTime: '10-15 seconds'
    },
    'flux-schnell': {
        name: 'Flux Schnell',
        points: 1,
        description: 'Fast generation with good quality',
        icon: 'Zap',
        isPremium: false,
        processingTime: '5-10 seconds'
    },
    'flux-dev': {
        name: 'Flux Dev',
        points: 3,
        description: 'High quality generation',
        icon: 'Star',
        isPremium: false,
        processingTime: '10-15 seconds'
    },
    'flux-1.1-pro': {
        name: 'Flux 1.1 Pro',
        points: 5,
        description: 'Ultra high quality with best details',
        icon: 'Sparkles',
        isPremium: true,
        processingTime: '15-20 seconds'
    },
    'flux-pro': {
        name: 'Flux Pro',
        points: 6,
        description: 'Professional quality with better details',
        icon: 'Crown',
        isPremium: true,
        processingTime: '20-25 seconds'
    }
};

export const ICON_COMPONENTS = {
    'ThumbsUp': ThumbsUp,
    'Zap': Zap,
    'Star': Star,
    'Sparkles': Sparkles,
    'Crown': Crown,
} as const;

export const ASPECT_RATIOS: AspectRatio[] = [
    {
        value: '1:1',
        label: 'Square (1:1)',
        description: 'Perfect for social media posts',
        width: 1024,
        height: 1024
    },
    {
        value: '16:9',
        label: 'Landscape (16:9)',
        description: 'Ideal for desktop wallpapers',
        width: 1920,
        height: 1080
    },
    {
        value: '9:16',
        label: 'Portrait (9:16)',
        description: 'Great for mobile wallpapers',
        width: 1080,
        height: 1920
    },
    {
        value: '4:3',
        label: 'Classic (4:3)',
        description: 'Traditional photo format',
        width: 1600,
        height: 1200
    },
    {
        value: '3:4',
        label: 'Portrait Classic (3:4)',
        description: 'Vertical traditional format',
        width: 1200,
        height: 1600
    },
    {
        value: '3:2',
        label: 'Photo (3:2)',
        description: 'Standard DSLR camera ratio',
        width: 1800,
        height: 1200
    },
    {
        value: '2:3',
        label: 'Portrait Photo (2:3)',
        description: 'Vertical DSLR camera ratio',
        width: 1200,
        height: 1800
    },
    {
        value: '21:9',
        label: 'Ultrawide (21:9)',
        description: 'Perfect for cinematic content',
        width: 2560,
        height: 1080
    },
    {
        value: '9:21',
        label: 'Vertical Ultrawide (9:21)',
        description: 'Vertical cinematic format',
        width: 1080,
        height: 2560
    },
    {
        value: '5:4',
        label: 'Large Format (5:4)',
        description: 'Ideal for printed photos',
        width: 1250,
        height: 1000
    },
    {
        value: '4:5',
        label: 'Instagram Portrait (4:5)',
        description: 'Perfect for Instagram portrait posts',
        width: 1080,
        height: 1350
    }
];

export const OUTPUT_FORMATS: OutputFormat[] = [
    {
        value: 'webp',
        label: 'WEBP',
        description: 'Best for web - smaller file size',
        mimeType: 'image/webp'
    },
    {
        value: 'png',
        label: 'PNG',
        description: 'Lossless quality with transparency',
        mimeType: 'image/png'
    },
    {
        value: 'jpg',
        label: 'JPG',
        description: 'Standard format for photos',
        mimeType: 'image/jpeg'
    }
];

export const ERROR_MESSAGES = {
    DAILY_LIMIT_REACHED: 'Daily free limit reached. Please login to continue.',
    NO_POINTS: 'You have no points left. Please purchase more to continue.',
    GENERATION_FAILED: 'Failed to generate image. Please try again.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    INVALID_PROMPT: 'Please enter a valid prompt to generate an image.',
    PREMIUM_REQUIRED: 'This model requires a premium subscription.'
} as const;

export const DEFAULTS = {
    MODEL: 'flux-1.1-pro-ultra' as ModelType,
    ASPECT_RATIO: '1:1',
    OUTPUT_FORMAT: 'jpg'
} as const;