const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const parseVoice = async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text is required' })

  const today = new Date().toISOString().split('T')[0]

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Extract transaction data from the text. Return ONLY valid JSON with no explanations.

	Text: "${text}"

	JSON format:
	{
	"title": string,
	"amount": number,
	"type": "income" or "expense",
	"date": "YYYY-MM-DD"
	}

	Today: ${today}. If no date is mentioned — use today's date.
	If the type is unclear — use "expense".`;

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const cleaned = raw.replace(/```json|```/g, '').trim()

    try {
      const parsed = JSON.parse(cleaned)
      res.json(parsed)
    } catch {
      res.status(422).json({ error: 'Failed to parse AI response' })
    }
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(502).json({ error: 'AI service unavailable' })
  }
}

module.exports = { parseVoice }
