import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY as string;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const generateContent = async (file: File, prompt: string) => {
    const base64Audio = await fileToBase64(file);
    const audioPart = {
        inlineData: {
            mimeType: file.type,
            data: base64Audio,
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, { text: prompt }] },
    });

    return response.text;
}

export const analyzeGender = async (file: File): Promise<string> => {
    try {
        const prompt = "이 오디오 파일에 사람의 목소리가 있다면, 그 목소리의 성별이 남성인지 여성인지 판단해주세요. 가능한 답변은 '남성', '여성' 또는 '판단 불가' 중 하나여야 합니다. 다른 설명은 추가하지 마세요.";
        return await generateContent(file, prompt);
    } catch (error) {
        console.error("Error analyzing audio for gender:", error);
        return '분석에 실패했습니다.';
    }
};

export const transcribeAudio = async (file: File): Promise<string> => {
    try {
        const prompt = "이 오디오 파일의 음성을 텍스트로 변환해주세요. 만약 노래라면 가사 형식으로 작성해주세요.";
        return await generateContent(file, prompt);
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return '텍스트 생성에 실패했습니다.';
    }
};
