# Product Overview

Flux AI is an AI-powered image generation platform that allows users to create images from text prompts using various Flux AI models.

## Core Features

- **Multi-model support**: Flux Schnell, Flux Dev, Flux Pro, Flux 1.1 Pro, and Flux 1.1 Pro Ultra
- **Authentication**: Google OAuth and email/password credentials via NextAuth
- **Points system**: Users consume points to generate images; different models require different point amounts
- **Free tier**: Limited free generations for anonymous users tracked by IP/fingerprint
- **Premium models**: Require login and sufficient points
- **Multi-language support**: 20+ languages with i18n routing (`/[locale]/...`)
- **Image tools**: Flux Canny, Depth, Fill, and Redux for image manipulation
- **Payment integration**: Stripe for purchasing points
- **Usage tracking**: Multi-layer tracking (fingerprint, IP, user ID) to prevent abuse

## Business Model

- Free tier with daily generation limits
- Paid points system for premium models and additional generations
- Different point costs per model (e.g., Schnell: 1 point, Pro: 5 points, Ultra: 10 points)
