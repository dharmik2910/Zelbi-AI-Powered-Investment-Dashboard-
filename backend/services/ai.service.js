import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getQuote } from "./marketData.service.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const MODEL_NAME = "gemini-2.5-flash";
const MAX_TOOL_ROUNDS = 4;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CHARS = 2000;

const SYSTEM_INSTRUCTIONS = {
    chat: `
        You are Zelbi, the AI assistant inside the Zelbi investment dashboard. You help people who are new to the stock market understand stocks and markets.
        - Always use the get_stock_quote tool for current prices, daily moves or 52-week ranges. Never guess or invent numbers.
        - When the user asks about their own portfolio or holdings, use the get_user_portfolio tool.
        - If a tool returns no data, say that live data isn't available for that symbol instead of making something up.
        - Indian stocks usually need an exchange suffix, for example RELIANCE:NSE or TCS:NSE. US stocks use plain tickers like AAPL.
        - When quoting live data, mention the currency and that prices may be delayed.
        - Answer in short bullet points, one line each, with a blank line between sections.
        - You are not a licensed financial adviser. For buy, sell or hold questions, give balanced pros and cons and end with a one-line reminder that this is not financial advice.
        - Do not use markdown bold and do not wrap stock names in **.
    `,
    analysis: `
        You are Zelbi's technical analysis engine. You receive recent price data and indicators for one stock and write a concise, structured analysis.
        - Only use the numbers you are given or that tools return. Never invent figures.
        - Use the markdown headings the user asks for, with short bullet points under each.
        - Be balanced: cover both upside and downside risks.
        - End with a one-line note that this is not financial advice.
    `,
};

const getStockQuoteTool = {
    declaration: {
        name: "get_stock_quote",
        description: "Get the latest price, daily change, volume and 52-week range for a stock or ETF.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                symbol: {
                    type: SchemaType.STRING,
                    description: "Ticker symbol, e.g. AAPL, MSFT, or RELIANCE:NSE for Indian stocks",
                },
            },
            required: ["symbol"],
        },
    },
    execute: async ({ symbol }) => {
        const quote = await getQuote(symbol);
        return quote ?? { error: `No market data found for ${symbol}` };
    },
};

/**
 * Converts client chat history into Gemini's format. Gemini requires the history
 * to start with a user turn and to alternate between user and model.
 * @param {{ role: "user" | "assistant", text: string }[]} history
 */
const toGeminiHistory = (history = []) => {
    const turns = [];
    for (const message of history.slice(-MAX_HISTORY_MESSAGES)) {
        if (!message || typeof message.text !== "string" || !message.text.trim()) continue;
        const role = message.role === "user" ? "user" : "model";
        const text = message.text.slice(0, MAX_HISTORY_CHARS);

        if (turns.length === 0 && role !== "user") continue;
        const last = turns[turns.length - 1];
        if (last && last.role === role) {
            last.parts[0].text += `\n\n${text}`;
        } else {
            turns.push({ role, parts: [{ text }] });
        }
    }
    // The next message we send is a user turn, so history must end with the model
    if (turns.length && turns[turns.length - 1].role === "user") {
        turns.pop();
    }
    return turns;
};

/**
 * Generates an AI response. Throws if the model call fails.
 * @param {Object} options
 * @param {string} options.prompt - The user's message
 * @param {Array} [options.history] - Earlier messages as { role, text }
 * @param {"chat" | "analysis"} [options.mode]
 * @param {Array} [options.extraTools] - More { declaration, execute } tools, e.g. per-user data
 */
export const generateResult = async ({ prompt, history = [], mode = "chat", extraTools = [] }) => {
    const tools = [getStockQuoteTool, ...extraTools];
    const toolsByName = Object.fromEntries(tools.map((tool) => [tool.declaration.name, tool]));

    const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: { temperature: 0.4 },
        systemInstruction: SYSTEM_INSTRUCTIONS[mode] ?? SYSTEM_INSTRUCTIONS.chat,
        tools: [{ functionDeclarations: tools.map((tool) => tool.declaration) }],
    });

    const chat = model.startChat({ history: toGeminiHistory(history) });
    let result = await chat.sendMessage(prompt);

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const calls = result.response.functionCalls();
        if (!calls || calls.length === 0) break;

        const responses = await Promise.all(
            calls.map(async (call) => {
                const tool = toolsByName[call.name];
                let output;
                try {
                    output = tool ? await tool.execute(call.args || {}) : { error: `Unknown tool ${call.name}` };
                } catch (error) {
                    console.error(`AI tool ${call.name} failed:`, error.message);
                    output = { error: "Data is temporarily unavailable" };
                }
                return { functionResponse: { name: call.name, response: { result: output } } };
            })
        );

        result = await chat.sendMessage(responses);
    }

    return result.response.text() || "No response generated";
};
