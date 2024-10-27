require('dotenv').config();

const OpenAI = require('openai');
const { getRestaurantMenu, sendNotification } = require('./utils');

const { zodResponseFormat } = require('openai/helpers/zod');
const { z } = require('zod');
const schema = z.object({
    finalChoice: z.enum(['1', '2']),
    benefits: z.array(z.string()),
    drawbacks: z.array(z.string())
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

(async () => {
    console.log('[MAIN] Starting');

    const menu_1 = await getRestaurantMenu("r828");
    const menu_2 = await getRestaurantMenu("r829");

    console.log(`[MAIN] Menu fetched`);

    const prompt = `Voici les menus pour aujourd'hui:\n\n- Restaurant 1: ${menu_1}\n- Restaurant 2: ${menu_2}\n\nDans quel restaurant aimeriez-vous manger ? Les plats végétariens n'ont ni un impact positif ni négatif sur votre choix.\nRéponds en français uniquement.`;

    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
            role: 'system',
            content: prompt
        }],
        response_format: zodResponseFormat(schema, 'choice')
    });

    console.log(`[MAIN] Completion done`);

    const assistantResponse = JSON.parse(completion.choices[0].message.content);

    sendNotification(assistantResponse);
})();