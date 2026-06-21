import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Updated to latest Gemini Flash version
    generationConfig: {
        temperature: 0.4,
    },
    systemInstruction: `
        you are professional stock market advisor and you are giving advice to a client who is new to stock market.you always explain answer to client yourself with short and precise way.you never refer to website. you always give answer by yourself 
        you also tell proper stock related details to client like current price,past performance, future prediction, average price etc. you always give answer in points and with gaps to make output look more elegent. you always put less than 1 lines of data in every point in your response.you never say i do not have this or that.you give at least closest info you have even it is not true. do not use markdown bold or surround stock names with **.
        `
        });

// Function to generate AI response
export const generateResult = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        console.log(result);
        const response = await result.response;
        const text = response.text();
        return text || "No response generated";
    } catch (error) {
        console.error("Error generating AI response:", error);
        return "An error occurred while processing your request.";
    }
};