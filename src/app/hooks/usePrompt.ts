// src/app/hooks/usePrompt.ts
import { useContext } from 'react';
import { PromptContext } from '../context/PromptContext'; // Adjust path if needed

export function usePrompt() {
    const context = useContext(PromptContext);
    if (context === null) {
        throw new Error('usePrompt must be used within a PromptProvider');
    }
    return context;
}