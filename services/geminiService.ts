
import { GoogleGenAI } from "@google/genai";

// Fix: Always use named parameter and direct process.env.API_KEY access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHRInsights = async (contextData: string): Promise<string> => {
  try {
    // Fix: Select 'gemini-3-flash-preview' for basic text tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      คุณคือผู้เชี่ยวชาญด้าน HR และนักวิเคราะห์ธุรกิจมืออาชีพ
      วิเคราะห์ข้อมูล JSON สรุปสถานะ HR และการเงินของบริษัทต่อไปนี้
      
      ให้เขียน "บทสรุปสำหรับผู้บริหาร" (Executive Summary) เป็น **ภาษาไทย** 
      โดยเน้น 3 ประเด็นสำคัญที่ควรดำเนินการต่อ (Actionable Insights)
      ใช้น้ำเสียงที่เป็นมืออาชีพ สุภาพ แต่ตรงไปตรงมาในเรื่องความเสี่ยง
      
      ข้อมูล:
      ${contextData}
    `,
    });

    // Fix: Directly access the .text property from GenerateContentResponse
    return response.text || "ไม่สามารถสร้างบทวิเคราะห์ได้";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "ระบบขัดข้องชั่วคราว ไม่สามารถวิเคราะห์ข้อมูลได้";
  }
};
