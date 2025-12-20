
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um assistente educacional especializado em criar conteúdo para ensino fundamental.
Seu tom deve ser encorajador e claro.
Sempre gere perguntas apropriadas para a série escolar especificada, evitando temas sensíveis.
`;

// Updated signature to accept excludeTexts as a 6th argument to resolve the compilation error in App.tsx
export const generateQuizQuestions = async (
  subject: string,
  difficulty: string,
  topic: string,
  grade: number,
  count: number = 5,
  excludeTexts: string[] = []
): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key não encontrada. Por favor, configure a chave de API.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use excludeTexts to help the model avoid repeating questions already present in the system
  const previousQuestionsInfo = excludeTexts.length > 0 
    ? `\n\nIMPORTANTE: Não gere perguntas parecidas com estas (já existentes): ${excludeTexts.slice(-30).join(' | ')}`
    : "";

  const prompt = `Crie ${count} perguntas de múltipla escolha sobre ${subject}, tópico: "${topic}".
  Público Alvo: Alunos do ${grade}º Ano do Ensino Fundamental (Brasil).
  Dificuldade: ${difficulty}.
  A linguagem deve ser adequada para a idade dessa série.
  Para cada pergunta, forneça uma explicação curta do motivo da resposta correta.${previousQuestionsInfo}`;

  try {
    const response = await ai.models.generateContent({
      // Updated to gemini-3-flash-preview for basic text tasks per coding guidelines
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { 
                type: Type.STRING,
                description: "O enunciado da pergunta."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "4 opções de resposta."
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "O índice (0-3) da resposta correta."
              },
              explanation: {
                type: Type.STRING,
                description: "Explicação curta de porque a resposta está correta."
              }
            },
            required: ["text", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Sem resposta da IA");

    const rawQuestions = JSON.parse(jsonText);
    
    // Map to our internal structure adding IDs
    return rawQuestions.map((q: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      text: q.text,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation
    }));

  } catch (error) {
    console.error("Erro ao gerar quiz:", error);
    // Fallback mock data
    return [
      {
        id: "err-1",
        text: `Erro ao conectar com a IA. Tente novamente mais tarde.`,
        options: ["Ok", "Entendi", "Certo", "Beleza"],
        correctAnswerIndex: 0,
        explanation: "Houve uma falha na conexão."
      }
    ];
  }
};
