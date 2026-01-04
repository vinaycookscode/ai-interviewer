'use server';

import { getAvailableGeminiModels, getGeminiModel } from './gemini-config';

interface ModelData {
    id: string;
    name: string;
    disabled: boolean;
    availableAt?: number;
}

export async function getAIStatus() {
    const models = await getAvailableGeminiModels();
    const currentModel = await getGeminiModel();

    const availableModels = models.filter((m: ModelData) => !m.disabled);
    const currentModelData = models.find((m: ModelData) => m.id === currentModel);
    const currentModelDisabled = currentModelData?.disabled || false;

    return {
        allModelsExhausted: availableModels.length === 0,
        currentModelAvailable: !currentModelDisabled,
        availableModels,
        currentModel,
        totalModels: models.length,
        currentModelData
    };
}
