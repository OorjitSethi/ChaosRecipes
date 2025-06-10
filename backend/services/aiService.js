// services/aiService.js

require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

if (!process.env.HUGGING_FACE_API_KEY) {
    throw new Error("Hugging Face API key not found. Please set HUGGING_FACE_API_KEY in your .env file.");
}

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
const model = "meta-llama/Meta-Llama-3-8B-Instruct";

// --- Helper function to parse LLM response ---
function parseLlmResponse(content) {
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const jsonMatchBlock = content.match(jsonBlockRegex);
    
    let jsonString = content;
    if (jsonMatchBlock) {
        jsonString = jsonMatchBlock[1];
    } else {
        const rawJsonMatch = content.match(/\{[\s\S]*\}/);
        if (rawJsonMatch) {
            jsonString = rawJsonMatch[0];
        }
    }

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from LLM response content:", jsonString, "Error:", e);
        return null;
    }
}

// --- AI Function 1: Generate Gadget Recipes at Game Start ---
async function generateInitialRecipes(playerCount, componentList) {
    const prompt = `
    You are a creative inventor for a sci-fi game.
    Your task is to generate ${playerCount} unique, cool-sounding gadget names.
    For each gadget, assign two DIFFERENT components from the following list: ${componentList.join(', ')}.
    
    Return your answer as a single, valid JSON object and nothing else.
    The keys should be the gadget names, and the values should be an array of the two required components.

    Example for 2 players:
    {
      "Quantum Entangler": ["Microchip", "Casing"],
      "Chrono-Stabilizer": ["FuelCell", "Microchip"]
    }

    Now, generate ${playerCount} recipes.
    `;

    try {
        console.log(`Requesting ${playerCount} recipes from LLM...`);
        const response = await hf.chatCompletion({
            model: model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 700,
        });
        const parsed = parseLlmResponse(response.choices[0].message.content);
        if (parsed && Object.keys(parsed).length >= playerCount) {
            console.log("LLM Recipe Response Parsed:", parsed);
            return parsed;
        }
        console.error("LLM failed to generate enough recipes. Parsed content:", parsed);
        return null;
    } catch (error) {
        console.error("Error calling Hugging Face API for recipes:", error);
        return null;
    }
}


// --- AI Function 2: Generate Guaranteed Price Change Each Turn ---
const fallbackPriceEvent = {
    title: "Market Stagnation",
    description: "Prices hold steady as traders await a new catalyst.",
    effect: { type: "PRICE_CHANGE", details: { item: "Polymer", newPrice: 8 } }
};

async function generatePriceChangeEvent(basePrices, existingModifiers) {
    const prompt = `
    You are a market analyst AI for a game. Your task is to create a single, logically consistent market event that causes a price change for one resource.

    **CONTEXT:**
    - The BASE prices are: ${JSON.stringify(basePrices)}.
    - The CURRENT active price modifiers from previous turns are: ${JSON.stringify(existingModifiers)}.

    **YOUR TASK:**
    Generate a new price change event by following these rules precisely.

    **RULES:**
    1.  **CHOOSE ONE ITEM:** You must select only one item from this list: "Carbon", "Silicon", "Polymer".
    2.  **CHOOSE A PRICE DELTA:** You must select a single integer for the price change (\`delta\`). It can be positive (for a price increase) or negative (for a price decrease). A reasonable delta is between -5 and +10.
    3.  **CREATE A NARRATIVE:** Write a short, creative \`title\` and a one-sentence \`description\` for the event.
    4.  **LOGICAL CONSISTENCY IS MANDATORY:** This is the most important rule. The story in your \`description\` MUST PERFECTLY MATCH the \`delta\`. 
        - If \`delta\` is **positive** (e.g., 7), your description MUST explain a shortage, high demand, or other reason for a price INCREASE.
        - If \`delta\` is **negative** (e.g., -4), your description MUST explain a surplus, low demand, or other reason for a price DECREASE.
    5.  **OUTPUT FORMAT:** You MUST return only a single, valid JSON object with the specified keys. All keys are required.

    **EXAMPLE OF A GOOD, CONSISTENT RESPONSE (POSITIVE DELTA):**
    {
      "title": "Silicon Shortage",
      "item": "Silicon",
      "delta": 6,
      "description": "A fire at a major manufacturing plant has created a sudden shortage, driving up Silicon prices."
    }

    **EXAMPLE OF A GOOD, CONSISTENT RESPONSE (NEGATIVE DELTA):**
    {
      "title": "Carbon Oversupply",
      "item": "Carbon",
      "delta": -3,
      "description": "New-generation factories have produced a surplus of Carbon, causing its market price to drop."
    }
    
    **EXAMPLE OF A BAD, INCONSISTENT RESPONSE (DO NOT DO THIS):**
    {
      "title": "Polymer Production Boost",
      "item": "Polymer",
      "delta": 5, // <--- BAD! Delta is positive, but description implies a negative change.
      "description": "A leading Polymer manufacturer has increased production, leading to an oversupply."
    }

    The description and the delta's sign (positive/negative) must align. Now, generate a new, logically consistent price change event.
    `;
    try {
        const response = await hf.chatCompletion({ model: model, messages: [{ role: "user", content: prompt }], max_tokens: 350 });
        // We still keep the server-side validation as a final safety net.
        return parseLlmResponse(response.choices[0].message.content);
    } catch (error) {
        console.error("Error in generatePriceChangeEvent:", error);
        return null; // Return null on error so the manager can handle it.
    }
}

async function generateExpirationReason(modifierTitle) {
    const prompt = `
    In our game, the market event called "${modifierTitle}" has just ended.
    Provide a creative, 1-sentence narrative reason why this market condition is now over.
    
    Return the result as a single, valid JSON object with this exact structure:
    {
      "description": "The reason the event ended."
    }

    Example:
    {
      "description": "The trade embargo was lifted, and Silicon prices are returning to normal."
    }

    Now, provide the reason for "${modifierTitle}" ending.
    `;
    try {
        const response = await hf.chatCompletion({ model: model, messages: [{ role: "user", content: prompt }], max_tokens: 200 });
        return parseLlmResponse(response.choices[0].message.content);
    } catch (error) {
        console.error("Error in generateExpirationReason:", error);
        return { description: `The effects of "${modifierTitle}" have faded.` }; // Fallback
    }
}


// --- AI Function 3: Generate the Major World Event ---
const fallbackWorldEvent = {
    title: "Static in the Aether",
    description: "The market signals are unusually quiet. Nothing major seems to have changed.",
    effect: { type: "NO_EFFECT", details: {} }
};

async function generateWorldEvent(gameStateContext) {
    const prompt = `
    You are the AI Game Master for "Recipe for Chaos".
    Your role is to introduce a single, unpredictable *major* World Event to make the game chaotic.
    I handle minor price changes separately. This is for the big stuff.

    Game State Context:
    ${JSON.stringify(gameStateContext, null, 2)}

    Based on this state, generate a creative World Event. You have a 30% chance of creating a CRAFTING_MODIFIER event, otherwise choose another.
    The event MUST be returned as a single, valid JSON object with this structure and nothing else:
    {
      "title": "A short, catchy event name.",
      "description": "A 1-2 sentence narrative description.",
      "effect": {
        "type": "CRAFTING_MODIFIER" | "MINI_QUEST" | "NO_EFFECT",
        "details": { ... }
      }
    }

    VALID EFFECT TYPES & DETAILS:
    1. CRAFTING_MODIFIER: Changes a recipe for this turn only.
       "details": { "component": "Microchip" | "Casing" | "FuelCell", "ingredient": "Carbon" | "Silicon" | "Polymer", "newAmount": <integer between 0 and 3> }
    2. MINI_QUEST: A small objective for a reward.
       "details": { "quest": "SELL" | "CRAFT", "item": "Casing" | "Polymer" | "Microchip", "quantity": <integer>, "rewardType": "COINS" | "FREE_ITEM", "rewardValue": <integer or an item name> }
    3. NO_EFFECT: A flavor-text only event.
       "details": {}

    Now, generate a new MAJOR World Event. Return only the JSON object.
    `;
    try {
        console.log("Requesting MAJOR World Event from LLM...");
        const response = await hf.chatCompletion({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
        });
        const parsed = parseLlmResponse(response.choices[0].message.content);
        return parsed || fallbackWorldEvent;
    } catch (error) {
        console.error("Error in generateWorldEvent:", error);
        return fallbackWorldEvent;
    }
}

module.exports = {
    generateInitialRecipes,
    generatePriceChangeEvent,
    generateExpirationReason,
    generateWorldEvent
};
