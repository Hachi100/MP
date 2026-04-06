/**
 * Client DeepSeek API — Agent IAPRMP
 * Toujours response_format JSON, temperature 0.1
 */

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"

interface DeepSeekMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface DeepSeekOptions {
  model?: "deepseek-chat" | "deepseek-reasoner"
  temperature?: number
  maxTokens?: number
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function appelDeepSeek<T>(
  systemPrompt: string,
  userContent: string,
  options: DeepSeekOptions = {}
): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY non configurée")
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ]

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || "deepseek-chat",
      messages,
      response_format: { type: "json_object" },
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API erreur ${response.status}: ${error}`)
  }

  const data = (await response.json()) as DeepSeekResponse
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error("Réponse DeepSeek vide")
  }

  return JSON.parse(content) as T
}
