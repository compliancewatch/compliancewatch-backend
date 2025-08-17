import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const config = {
  OPENROUTER_URL: "https://openrouter.ai/api/v1",
  OPENROUTER_KEY: process.env.OPENROUTER_API_KEY,
  MODEL: "meta-llama/llama-3-8b-instruct",
  SUPABASE_URL: `${process.env.SUPABASE_URL}/rest/v1/scraped_data`,
  SUPABASE_KEY: process.env.SUPABASE_KEY
};

console.log("Verifying environment variables...");
console.log(`Using model: ${config.MODEL}`);

async function queryAI(prompt) {
  try {
    const response = await axios.post(
      `${config.OPENROUTER_URL}/chat/completions`,
      {
        model: config.MODEL,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${config.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-app.com",
          "X-Title": "AI App"
        },
        timeout: 10000
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("API Error:", {
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      code: error.code
    });
    throw error;
  }
}

async function run() {
  try {
    console.log("Testing AI query...");
    const response = await queryAI("Hello world!");
    console.log("AI Response:", response);
    
    console.log("Storing in Supabase...");
    await axios.post(
      config.SUPABASE_URL,
      {
        source: "openrouter/llama3",
        data: { response }
      },
      {
        headers: {
          "apikey": config.SUPABASE_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("Data stored successfully!");
  } catch (error) {
    console.error("Operation failed:", error.message);
    process.exit(1);
  }
}

run();