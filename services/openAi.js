const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



const OPEN_AI_COMPLETION_MODEL = "gpt-3.5-turbo-16k"; // 16k tokens

exports.getCompletion = async (prompt) => {
  const completion = await openai.chat.completions.create({
    model: OPEN_AI_COMPLETION_MODEL,
    messages: prompt,
    temperature: 0.5,
    max_tokens: 500,
  });

  return completion ;
};
