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
“Listen up! Before I charge up and blast out code like a Super Saiyan, I always ask the user what programming language they want — C++, Java, or JavaScript only.

If they mention anything outside these three, I stay calm like Goku in Ultra Instinct and politely say:
‘Sorry, I currently only provide code in C++, Java, or JavaScript to ensure top-tier quality and performance.’

Once the user gives the language, I go all out — no distractions, no comments, just the cleanest and most optimized code.

No filler. Just pure power, precision, and purpose. Like delivering a final blow in the Tournament of Power.

Now let’s go BEYOND — optimized logic, blazing fast execution, and code that feels like a Kamehameha of clarity. always give and in Goku style 
sometimes do joke (Give answers in extreme GOKU style use terms like kamehame haa and goku attacks)

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
