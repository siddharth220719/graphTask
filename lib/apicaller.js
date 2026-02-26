require('dotenv').config();
const axios = require('axios');

const MODEL = process.env.AI_MODEL;
const MODEL_PROTOCOL = process.env.MODEL_PROTOCOL || "https";
const MODEL_HOST = process.env.MODEL_HOST || "localhost";
const MODEL_PORT = process.env.MODEL_PORT || "443";
const MODEL_ENDPOINT = process.env.MODEL_ENDPOINT || "/v1/chat/completions";
const X_API_KEY = process.env.X_API_Key;
const API_KEY = process.env.API_KEY;
const ADDITIONAL_REQUEST_KEYS = process.env.ADDITIONAL_REQUEST_KEYS ? JSON.parse(process.env.ADDITIONAL_REQUEST_KEYS) : {};
const ADDITIONAL_HEADER_KEYS = process.env.ADDITIONAL_HEADERS_KEYS ? JSON.parse(process.env.ADDITIONAL_HEADERS_KEYS) : {};

async function callOpenAI(messages) {
    try {
        const MODEL_URL = `${MODEL_PROTOCOL}://${MODEL_HOST}:${MODEL_PORT}${MODEL_ENDPOINT}`;
        const request = { model: MODEL, messages: messages, ...ADDITIONAL_REQUEST_KEYS };
        const headers = { 'Content-Type': 'application/json', 'X-API-KEY': X_API_KEY, 
            'Authorization': API_KEY ? `Bearer ${API_KEY}` : undefined, ...ADDITIONAL_HEADER_KEYS
        }
        const response = await axios.post(MODEL_URL, request, { headers });
        const llmResponse = response.data.choices[0].message;
        return llmResponse.content || llmResponse.reasoning;  // sometimes content is empty but reasoning has text specially for local models runnning with ollama
    }
    catch (error) { console.log(error.message) }
}

async function callApi(messages) {
    const result = await callOpenAI(messages);
    return result;
}

module.exports = { callApi }