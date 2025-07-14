const { GoogleGenAI } = require("@google/genai");

const solveDoubt = async (req, res) => {
  try {
    console.log("🟢 solveDoubt called");
    const { messages, title, description, testCases, startCode } = req.body;

    console.log("📨 Incoming Messages:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message:  "'messages' is required and must be a non-empty array." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: messages,
      config: {
        systemInstruction: `
You are a DSA tutor. Only help with the current problem below. Never answer unrelated questions.

[Title]: ${title}  
[Description]: ${description}  
[Examples]: ${testCases}  
[startCode]: ${startCode}  

Reply like Salman Khan — energetic, to the point, and friendly.  
Give hints first. Only share full solution if user asks.  
Code only in C++, Java, or JavaScript.  
Explain clearly. Keep responses short and helpful.

        `,
      },
    });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of stream) {
      const text = chunk.text; // ✅ this is now CORRECT
    //   console.log("📤 Chunk:", text);
      res.write(text);
    }

    res.end();
  } catch (err) {
    console.error("🔥 AI Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

module.exports = solveDoubt;
