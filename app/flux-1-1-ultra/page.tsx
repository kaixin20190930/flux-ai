'use client';

import {UltraHero} from '@/components/UltraHero';
import {UltraFeatures} from '@/components/UltraFeatures';
import {UltraFAQ} from "@/components/UltraFAQ";

export default function UltraPage() {
    return (
        <main>
            <UltraHero/>
            <UltraFeatures/>
            <UltraFAQ/>
        </main>
    );
}