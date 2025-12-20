import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

const SYSTEM_INSTRUCTION = `
Você é um assistente educacional especializado em criar conteúdo para ensino fundamental.
Seu tom deve ser encorajador e claro.
Sempre gere perguntas apropriadas para a série escolar especificada.
O sistema irá gerenciar o posicionamento das respostas para garantir variedade máxima. 
Forneça sempre 4 opções de resposta claras e distintas.
IMPORTANTE: Você deve ser criativo e variar os temas e abordagens. Não repita perguntas ou conceitos idênticos aos fornecidos na lista de exclusão.
`;

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

  const previousQuestionsInfo = excludeTexts.length > 0 
    ? `\n\nIMPORTANTE: Não gere perguntas parecidas com estas (já existentes): ${excludeTexts.slice(-30).join(' | ')}`
    : "";

  const prompt = `Crie ${count} perguntas de múltipla escolha sobre ${subject}, tópico: "${topic}".
  Público Alvo: Alunos do ${grade}º Ano do Ensino Fundamental (Brasil).
  Dificuldade: ${difficulty}.
  A linguagem deve ser adequada para a idade dessa série.
  Para cada pergunta, forneça exatamente 4 opções de resposta e uma explicação curta do motivo da resposta correta.${previousQuestionsInfo}`;

  try {
    const response = await ai.models.generateContent({
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
                description: "Lista com exatamente 4 opções de resposta."
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "O índice (0-3) da resposta correta na lista original."
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
    
    // --- Lógica de Diversificação Estrita (Anti-Streak) ---
    // 1. Criar um pool balanceado [0, 1, 2, 3, 0, 1, 2, 3...]
    let indexPool: number[] = [];
    for (let i = 0; i < rawQuestions.length; i++) {
        indexPool.push(i % 4);
    }
    
    // 2. Embaralhamento robusto (Fisher-Yates)
    for (let i = indexPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indexPool[i], indexPool[j]] = [indexPool[j], indexPool[i]];
    }

    // 3. Algoritmo de De-clumping: Garante que pool[i] !== pool[i-1]
    // Se encontrar repetido, troca com o próximo elemento diferente disponível
    for (let i = 1; i < indexPool.length; i++) {
        if (indexPool[i] === indexPool[i - 1]) {
            for (let j = i + 1; j < indexPool.length; j++) {
                if (indexPool[j] !== indexPool[i]) {
                    [indexPool[i], indexPool[j]] = [indexPool[j], indexPool[i]];
                    break;
                }
            }
        }
    }

    // 4. Caso a última posição ainda seja repetida (raro em pools pequenos), 
    // tentamos uma troca reversa se houver mais de 2 itens
    if (indexPool.length > 1 && indexPool[indexPool.length - 1] === indexPool[indexPool.length - 2]) {
        for (let i = 0; i < indexPool.length - 2; i++) {
            if (indexPool[i] !== indexPool[indexPool.length - 1] && indexPool[i+1] !== indexPool[indexPool.length - 1]) {
                const last = indexPool.length - 1;
                [indexPool[last], indexPool[i]] = [indexPool[i], indexPool[last]];
                break;
            }
        }
    }

    return rawQuestions.map((q: any, index: number) => {
      const options = Array.isArray(q.options) ? q.options : ["A", "B", "C", "D"];
      const correctText = options[q.correctAnswerIndex] || options[0];
      const otherTexts = options.filter((_: any, i: number) => i !== q.correctAnswerIndex);
      
      // Usa o índice do pool estritamente diversificado
      const targetIndex = indexPool[index];
      
      const finalOptions: string[] = new Array(4);
      finalOptions[targetIndex] = correctText;
      
      let currentOtherIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (i === targetIndex) continue;
        // Garante que não pegamos o texto da correta por acidente se a IA falhou no JSON
        let otherVal = otherTexts[currentOtherIdx];
        if (otherVal === correctText) {
            otherVal = `Alternativa ${i + 1}`;
        }
        finalOptions[i] = otherVal || `Opção ${i + 1}`;
        currentOtherIdx++;
      }

      return {
        id: `gen-${Date.now()}-${index}`,
        text: q.text,
        options: finalOptions,
        correctAnswerIndex: targetIndex,
        explanation: q.explanation
      };
    });

  } catch (error) {
    console.error("Erro ao gerar quiz:", error);
    return [
      {
        id: "err-1",
        text: `Houve um probleminha ao conectar com a nossa IA. Podemos tentar de novo?`,
        options: ["Sim, vamos tentar!", "Claro", "Pode ser", "Com certeza"],
        correctAnswerIndex: Math.floor(Math.random() * 4),
        explanation: "O servidor de inteligência artificial pode estar ocupado no momento."
      }
    ];
  }
};