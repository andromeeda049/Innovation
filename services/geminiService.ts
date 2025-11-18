import { GoogleGenAI, Type } from "@google/genai";
import { NutrientInfo, BMIHistoryEntry, TDEEHistoryEntry, MealPlan, PlannerResults, LocalFoodSuggestion } from '../types';

const foodAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    calories: {
      type: Type.NUMBER,
      description: "แคลอรี่ทั้งหมดโดยประมาณของมื้ออาหาร"
    },
    protein: {
      type: Type.NUMBER,
      description: "โปรตีนโดยประมาณ (กรัม)"
    },
    carbohydrates: {
      type: Type.NUMBER,
      description: "คาร์โบไฮเดรตโดยประมาณ (กรัม)"
    },
    fat: {
      type: Type.NUMBER,
      description: "ไขมันโดยประมาณ (กรัม)"
    },
    description: {
      type: Type.STRING,
      description: "คำอธิบายโดยรวมสั้นๆ เกี่ยวกับมื้ออาหารนี้"
    },
    items: {
      type: Type.ARRAY,
      description: "รายการอาหารแต่ละอย่างที่ระบุได้ในภาพ",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "ชื่อของรายการอาหาร"
          },
          calories: {
            type: Type.NUMBER,
            description: "แคลอรี่โดยประมาณของรายการอาหารนี้"
          }
        },
        required: ['name', 'calories']
      }
    }
  },
  required: ['calories', 'protein', 'carbohydrates', 'fat', 'description', 'items']
};

export const analyzeFoodFromImage = async (base64Image: string, mimeType: string, apiKey: string): Promise<NutrientInfo> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: "คุณคือผู้เชี่ยวชาญด้านโภชนาการ วิเคราะห์ภาพอาหารนี้ ระบุรายการอาหารแต่ละอย่างพร้อมประเมินแคลอรี่ของแต่ละรายการ และสรุปคุณค่าทางโภชนาการทั้งหมด ตอบกลับเป็นรูปแบบ JSON ที่ถูกต้องตาม schema ที่ให้มาเท่านั้น"
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (
      typeof parsedJson.calories !== 'number' ||
      typeof parsedJson.protein !== 'number' ||
      typeof parsedJson.carbohydrates !== 'number' ||
      typeof parsedJson.fat !== 'number' ||
      typeof parsedJson.description !== 'string' ||
      !Array.isArray(parsedJson.items)
    ) {
      throw new Error('การตอบกลับของ API มีรูปแบบไม่ถูกต้อง');
    }

    return parsedJson as NutrientInfo;
  } catch (error) {
    console.error("Error analyzing food image with Gemini:", error);
    throw new Error('ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่อีกครั้ง');
  }
};

export const analyzeFoodFromText = async (text: string, apiKey: string): Promise<NutrientInfo> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `คุณคือผู้เชี่ยวชาญด้านโภชนาการ วิเคราะห์อาหารจากข้อความต่อไปนี้: "${text}". ระบุรายการอาหารแต่ละอย่างพร้อมประเมินแคลอรี่ของแต่ละรายการ และสรุปคุณค่าทางโภชนาการทั้งหมด ตอบกลับเป็นรูปแบบ JSON ที่ถูกต้องตาม schema ที่ให้มาเท่านั้น`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: foodAnalysisSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (
      typeof parsedJson.calories !== 'number' ||
      typeof parsedJson.protein !== 'number' ||
      typeof parsedJson.carbohydrates !== 'number' ||
      typeof parsedJson.fat !== 'number' ||
      typeof parsedJson.description !== 'string' ||
      !Array.isArray(parsedJson.items)
    ) {
      throw new Error('การตอบกลับของ API มีรูปแบบไม่ถูกต้อง');
    }

    return parsedJson as NutrientInfo;
  } catch (error) {
    console.error("Error analyzing food text with Gemini:", error);
    throw new Error('ไม่สามารถวิเคราะห์ข้อความได้ กรุณาลองใหม่อีกครั้ง');
  }
};

const localFoodSuggestionSchema = {
    type: Type.ARRAY,
    description: "รายการแนะนำอาหารท้องถิ่น",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "ชื่อเมนูอาหารท้องถิ่น" },
            description: { type: Type.STRING, description: "คำอธิบายสั้นๆ เกี่ยวกับเมนูอาหารนี้" },
            calories: { type: Type.NUMBER, description: "แคลอรี่โดยประมาณต่อหนึ่งหน่วยบริโภค" },
        },
        required: ['name', 'description', 'calories']
    }
};

export const getLocalFoodSuggestions = async (lat: number, lon: number, apiKey: string): Promise<LocalFoodSuggestion[]> => {
    if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
คุณคือผู้เชี่ยวชาญด้านอาหารท้องถิ่นของไทย
จากตำแหน่งพิกัดละติจูด ${lat} และลองจิจูด ${lon}, โปรดแนะนำเมนูอาหารท้องถิ่นที่น่าสนใจและเป็นที่นิยมในบริเวณนั้นมา 5-7 อย่าง
สำหรับแต่ละเมนู ให้ระบุข้อมูลต่อไปนี้:
1.  ชื่อเมนู
2.  คำอธิบายสั้นๆ ที่น่าสนใจ
3.  แคลอรี่โดยประมาณต่อหนึ่งหน่วยบริโภค

ตอบกลับเป็นรูปแบบ JSON array ที่ถูกต้องตาม schema ที่กำหนดเท่านั้น ห้ามมีข้อความอื่นใดนอกเหนือจาก JSON
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: localFoodSuggestionSchema,
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedJson)) {
            throw new Error('API response is not an array.');
        }

        return parsedJson as LocalFoodSuggestion[];
    } catch (error) {
        console.error("Error getting local food suggestions:", error);
        throw new Error('ไม่สามารถค้นหาอาหารท้องถิ่นได้ในขณะนี้');
    }
}

export const getHealthCoachingTip = async (data: { bmi?: BMIHistoryEntry; tdee?: TDEEHistoryEntry; food?: NutrientInfo | null }, apiKey: string): Promise<string> => {
  if (!apiKey) return "กรุณาตั้งค่า API Key ในหน้าตั้งค่าก่อนใช้งานฟีเจอร์นี้";
  const ai = new GoogleGenAI({ apiKey });
  
  let prompt = "คุณคือโค้ชสุขภาพ AI ที่เป็นมิตรและให้กำลังใจ\n\n";
  prompt += "จากข้อมูลต่อไปนี้:\n";

  if (data.bmi) {
    prompt += `- ค่า BMI ล่าสุด: ${data.bmi.value.toFixed(2)} (จัดอยู่ในเกณฑ์: ${data.bmi.category})\n`;
  }
  if (data.tdee) {
    prompt += `- พลังงานที่ต้องการต่อวัน (TDEE): ${Math.round(data.tdee.value)} กิโลแคลอรี่\n`;
  }
  if (data.food) {
    prompt += `- มื้ออาหารล่าสุดที่วิเคราะห์: ${data.food.description} (~${Math.round(data.food.calories)} กิโลแคลอรี่)\n`;
  }
  
  if (!data.bmi && !data.tdee && !data.food) {
      return "ฉันยังไม่มีข้อมูลเกี่ยวกับคุณเลย ลองใช้เครื่องมือคำนวณ BMI, TDEE หรือวิเคราะห์อาหาร เพื่อให้ฉันสามารถให้คำแนะนำที่เหมาะกับคุณได้นะคะ";
  }

  prompt += "\nโปรดให้คำแนะนำด้านสุขภาพที่สั้น กระชับ สร้างสรรค์ และนำไปปฏิบัติได้จริงสำหรับวันนี้ 1 ข้อ (ตอบเป็นภาษาไทย)";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting health coaching tip:", error);
    throw new Error('ไม่สามารถรับคำแนะนำจาก AI ได้ในขณะนี้');
  }
};

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    menu: { type: Type.STRING, description: "ชื่อเมนูอาหาร" },
    protein: { type: Type.NUMBER, description: "โปรตีน (กรัม)" },
    carbohydrate: { type: Type.NUMBER, description: "คาร์โบไฮเดรต (กรัม)" },
    fat: { type: Type.NUMBER, description: "ไขมัน (กรัม)" },
    calories: { type: Type.NUMBER, description: "แคลอรี่ (kcal)" },
  },
  required: ['menu', 'protein', 'carbohydrate', 'fat', 'calories']
};

const mealPlanSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            day: { type: Type.STRING, description: "ชื่อวัน (เช่น 'วันที่ 1', 'วันที่ 2')" },
            breakfast: mealSchema,
            lunch: mealSchema,
            dinner: mealSchema,
            dailyTotal: {
                type: Type.OBJECT,
                properties: {
                    protein: { type: Type.NUMBER },
                    carbohydrate: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    calories: { type: Type.NUMBER },
                },
                required: ['protein', 'carbohydrate', 'fat', 'calories']
            }
        },
        required: ['day', 'breakfast', 'lunch', 'dinner', 'dailyTotal']
    }
};


export const generateMealPlan = async (
  results: PlannerResults,
  cuisine: string,
  diet: string,
  apiKey: string
): Promise<MealPlan> => {
  if (!apiKey) throw new Error('กรุณาตั้งค่า API Key ก่อนใช้งาน');
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
คุณคือสุดยอดนักโภชนาการที่เชี่ยวชาญด้านอาหารไทย
สร้างแผนอาหารเพื่อสุขภาพสำหรับ 7 วัน โดยยึดตามเป้าหมายและข้อกำหนดต่อไปนี้อย่างเคร่งครัด:

**เป้าหมายโภชนาการต่อวัน:**
- พลังงานรวม (TDEE): ประมาณ ${results.tdee.toFixed(0)} kcal
- โปรตีน: ประมาณ ${results.proteinGoal.toFixed(0)} กรัม
- คาร์โบไฮเดรต: ประมาณ ${results.carbGoal.toFixed(0)} กรัม
- ไขมัน: ประมาณ ${results.fatGoal.toFixed(0)} กรัม

**ข้อกำหนดแผนอาหาร:**
1.  **ประเภทอาหาร:** อาหารไทย (${cuisine})
2.  **ข้อจำกัด:** ${diet} (หากเป็น 'ทั่วไป' ให้สร้างเมนูที่หลากหลาย หากเป็น 'ฮาลาล' ห้ามมีหมูโดยเด็ดขาด หากเป็น 'เจ' หรือ 'มังสวิรัติ' ให้ใช้โปรตีนจากพืช)
3.  **จำนวนมื้อ:** 3 มื้อต่อวัน (เช้า, กลางวัน, เย็น)
4.  **ความหลากหลาย:** ห้ามมีเมนูอาหารซ้ำกันเลยตลอดทั้ง 7 วัน
5.  **พลังงานขั้นต่ำ:** พลังงานรวมของแต่ละวันต้องไม่ต่ำกว่าค่า BMR (${results.bmr.toFixed(0)} kcal)
6.  **ความถูกต้อง:** คำนวณค่าสารอาหารและแคลอรี่ของแต่ละเมนูและผลรวมของแต่ละวันให้แม่นยำที่สุด
7.  **รูปแบบผลลัพธ์:** ตอบกลับเป็น JSON object ที่ถูกต้องตาม schema ที่กำหนดเท่านั้น ห้ามมีข้อความอื่นใดนอกเหนือจาก JSON

สร้างสรรค์เมนูที่น่าสนใจและเหมาะสมกับเป้าหมายสุขภาพของผู้ใช้
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: mealPlanSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Basic validation
    if (!Array.isArray(parsedJson) || parsedJson.length !== 7) {
      throw new Error('API response is not a 7-day array.');
    }

    return parsedJson as MealPlan;
  } catch (error) {
    console.error("Error generating meal plan with Gemini:", error);
    throw new Error('ไม่สามารถสร้างแผนอาหารได้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง');
  }
};