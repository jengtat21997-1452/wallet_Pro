import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client with proper configuration and User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint: AI-assisted categorization of a note
app.post("/api/gemini/categorize", async (req, res) => {
  try {
    const { note, currentCategories } = req.body;
    if (!note) {
      return res.status(400).json({ error: "Note is required" });
    }

    const categoriesList = Array.isArray(currentCategories) && currentCategories.length > 0
      ? currentCategories.map(c => `- ${c.name} (${c.type === 'income' ? 'รายรับ' : 'รายจ่าย'})`).join("\n")
      : "- อาหาร (รายจ่าย)\n- เดินทาง (รายจ่าย)\n- ช้อปปิ้ง (รายจ่าย)\n- ที่พัก (รายจ่าย)\n- เงินเดือน (รายรับ)\n- โบนัส (รายรับ)";

    const prompt = `วิเคราะห์บันทึกช่วยจำการเงินนี้: "${note}"
กรุณาจัดหมวดหมู่และประเภทของรายการการเงินนี้ (ว่าเป็น รายรับ หรือ รายจ่าย) โดยเทียบกับหมวดหมู่ที่มีอยู่ด้านล่างนี้ หรือเสนอหมวดหมู่ใหม่ที่เหมาะสมที่สุดหากไม่มีในรายการ:

หมวดหมู่ปัจจุบัน:
${categoriesList}

โปรดคืนค่าในรูปแบบ JSON เท่านั้น`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณคือผู้ช่วยจัดการบัญชีและการเงินส่วนบุคคลอัจฉริยะที่เชี่ยวชาญการจัดหมวดหมู่ประเภทรายรับ-รายจ่ายเป็นภาษาไทยอย่างถูกต้องและเป็นระบบ",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { 
              type: Type.STRING, 
              description: "ชื่อหมวดหมู่ที่เหมาะสมที่สุด (ภาษาไทย) เช่น อาหาร, เดินทาง, ช้อปปิ้ง, ค่าธรรมเนียม, เงินเดือน" 
            },
            type: { 
              type: Type.STRING, 
              description: "ประเภทรายการ ต้องเป็นคำว่า 'income' (รายรับ) หรือ 'expense' (รายจ่าย) เท่านั้น" 
            },
            confidence: { 
              type: Type.NUMBER, 
              description: "ระดับความมั่นใจ ตั้งแต่ 0.0 ถึง 1.0" 
            },
            reason: { 
              type: Type.STRING, 
              description: "คำอธิบายสั้นๆ เป็นภาษาไทยว่าทำไมถึงจัดในหมวดหมู่นี้" 
            }
          },
          required: ["category", "type", "confidence", "reason"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in categorize API:", error);
    res.status(500).json({ error: error.message || "Failed to categorize note" });
  }
});

// Endpoint: AI-assisted transaction insight / summary & tip
app.post("/api/gemini/summarize-transaction", async (req, res) => {
  try {
    const { transaction } = req.body;
    if (!transaction) {
      return res.status(400).json({ error: "Transaction detail is required" });
    }

    const { type, amount, category, note, date } = transaction;

    const prompt = `วิเคราะห์ข้อมูลรายการต่อไปนี้:
- ประเภท: ${type === 'income' ? 'รายรับ' : 'รายจ่าย'}
- จำนวนเงิน: ฿${amount.toLocaleString()}
- หมวดหมู่: ${category}
- รายละเอียด: ${note || 'ไม่มีระบุ'}
- วันที่: ${date || 'ไม่มีระบุ'}

กรุณาสรุปรายการนี้สั้นๆ พร้อมคำแนะนำด้านการเงินหรือการประหยัดออมที่เหมาะสมและสร้างสรรค์`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณคือโค้ชการเงินส่วนบุคคลที่อบอุ่นและมีอารมณ์ดี ให้คำแนะนำเชิงบวกที่นำไปใช้ได้จริงและมีประโยชน์ในการช่วยวางแผนทางการเงิน",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { 
              type: Type.STRING, 
              description: "บทสรุปรายการและภาพรวมของธุรกรรมนี้สั้นๆ ใน 1 ประโยค" 
            },
            tip: { 
              type: Type.STRING, 
              description: "คำแนะนำทางการเงินที่เป็นมิตร การออมเงิน หรือทางเลือกอื่นในการประหยัดสำหรับรายการลักษณะนี้" 
            }
          },
          required: ["summary", "tip"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in summarize-transaction API:", error);
    res.status(500).json({ error: error.message || "Failed to analyze transaction" });
  }
});

// Endpoint: AI-assisted parsing of bank transfer slips
app.post("/api/gemini/parse-slip", async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Base64 image is required" });
    }

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageMimeType = mimeType || "image/jpeg";

    const prompt = `นี่คือรูปภาพสลิปการโอนเงินธนาคารของไทย กรุณาอ่านข้อมูลจากภาพสลิปนี้อย่างละเอียด และสกัดข้อมูลออกมาตามโครงสร้าง JSON:
1. จำนวนเงินที่โอน (amount) เป็นตัวเลขทศนิยม
2. วันที่โอน (date) ในรูปแบบสากล YYYY-MM-DD (เช่น สลิปเขียน 6 ก.ค. 2569 หรือ 2026-07-06 ให้แปลงเป็น "2026-07-06")
3. เวลาโอน (time) ในรูปแบบ HH:MM
4. บันทึกสั้นๆ (note) โดยสรุปชื่อผู้รับโอนหรือลักษณะรายการโอน เช่น "โอนไปบัญชี สมชาย" หรือ "จ่ายเงินค่าอาหาร"
5. หมวดหมู่รายการ (category) ภาษาไทยที่แนะนำและสอดคล้องที่สุด (เช่น อาหาร, เดินทาง, ช้อปปิ้ง, บันเทิง, อื่นๆ)
6. ประเภทรายการ (type) ว่าเป็น "expense" หรือ "income" (ส่วนใหญ่การสแกนสลิปโอนคือ "expense" ยกเว้นกรณีตรวจพบว่าเป็นเงินเข้าอย่างชัดเจน)
7. ค่าความเชื่อมั่น (confidence) ระหว่าง 0.0 ถึง 1.0`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: imageMimeType
          }
        },
        prompt
      ],
      config: {
        systemInstruction: "คุณคือบอทอ่านสลิปธนาคารไทยอัจฉริยะ คุณสามารถตรวจจับข้อมูลจากตัวหนังสือและโลโก้ธนาคารในรูปภาพเพื่อคืนค่าข้อมูลทางการเงินที่เป็นระบบได้อย่างแม่นยำสูงสุด",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "จำนวนเงินโอนในหน่วยบาท (THB) ตัวเลขทศนิยม" },
            date: { type: Type.STRING, description: "วันที่โอน YYYY-MM-DD" },
            time: { type: Type.STRING, description: "เวลาโอน HH:MM" },
            note: { type: Type.STRING, description: "คำอธิบายหรือสรุปสั้นๆ เช่น จ่ายเงินให้คุณสมศรี หรือ ซื้อสินค้าสร้านอาหาร" },
            category: { type: Type.STRING, description: "หมวดหมู่ภาษไทย เช่น อาหาร, เดินทาง, ช้อปปิ้ง, ค่าสาธารณูปโภค, โอนเงิน" },
            type: { type: Type.STRING, description: "ประเภท 'expense' หรือ 'income'" },
            confidence: { type: Type.NUMBER, description: "ความน่าเชื่อถือของการวิเคราะห์ตั้งแต่ 0.0 - 1.0" }
          },
          required: ["amount", "category", "type", "confidence"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Cannot extract data from slip image");
    }

    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in parse-slip API:", error);
    res.status(500).json({ error: error.message || "Failed to parse slip image" });
  }
});

// Endpoint: Monthly financial checkup report
app.post("/api/gemini/monthly-checkup", async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "Transactions list must be an array" });
    }

    const formattedTxs = transactions.slice(0, 100).map(tx => 
      `- [${tx.date || 'ไม่ระบุ'}] ${tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}: ฿${tx.amount} หมวดหมู่: ${tx.category} (บันทึก: ${tx.note || 'ไม่มี'})`
    ).join("\n");

    const prompt = `นี่คือรายการธุรกรรมทางการเงินของฉันในเดือนนี้ล่าสุด (จำกัด 100 รายการ):
${formattedTxs || "ไม่มีรายการธุรกรรมในเดือนนี้"}

กรุณาวิเคราะห์สุขภาพทางการเงิน สรุปสัดส่วนการใช้จ่าย ให้คะแนนเกรดการบริหารเงิน พร้อมจุดเด่น จุดที่ควรระวัง และแผนการดำเนินงาน 3 ข้อเพื่อปรับปรุงสุขภาพการเงินในอนาคต`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณคือผู้อำนวยการฝ่ายให้คำปรึกษาการเงินส่วนบุคคลอัจฉริยะและเป็นโค้ชการเงินส่วนตัว ให้คำปรึกษาที่สร้างแรงบันดาลใจและเจาะลึก",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.STRING, description: "เกรดความสุขภาพทางการเงิน (A+, A, B, C, D, F)" },
            savingRate: { type: Type.NUMBER, description: "อัตราการออมเงินคิดเป็นเปอร์เซ็นต์เทียบกับรายรับทั้งหมด (เช่น 15.5)" },
            statusText: { type: Type.STRING, description: "ประเมินสุขภาพการเงิน เช่น ดีเยี่ยม, แข็งแรง, ปานกลาง, ควรระมัดระวังเป็นพิเศษ" },
            analysis: { type: Type.STRING, description: "บทวิเคราะห์พฤติกรรมการใช้จ่ายและสัดส่วนที่สำคัญอย่างละเอียดเป็นภาษาไทย" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "จุดเด่นที่ทำได้ดีในเดือนนี้ (อย่างน้อย 2 ข้อ)" },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "จุดที่ควรปรับปรุงหรือเตือนความจำ (อย่างน้อย 2 ข้อ)" },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "แผนปฏิบัติการการเงินระยะสั้น 3 ข้อเพื่อปรับใช้ทันที" }
          },
          required: ["score", "savingRate", "statusText", "analysis", "strengths", "weaknesses", "actionPlan"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API for monthly checkup");
    }

    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in monthly checkup API:", error);
    res.status(500).json({ error: error.message || "Failed to generate monthly checkup" });
  }
});

// Endpoint: Smart Budget Recommendation
app.post("/api/gemini/budget-recommendation", async (req, res) => {
  try {
    const { transactions, currentDailyBudget } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "Transactions list must be an array" });
    }

    const formattedTxs = transactions.slice(0, 100).map(tx => 
      `- ${tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}: ฿${tx.amount} (หมวดหมู่: ${tx.category})`
    ).join("\n");

    const prompt = `ข้อมูลทางการเงินเพื่อคำนวณงบประมาณ:
- งบประมาณรายวันปัจจุบัน: ฿${currentDailyBudget || "ไม่ได้ตั้งไว้"}
- รายการทางการเงินปัจจุบัน:
${formattedTxs || "ยังไม่มีข้อมูลธุรกรรม"}

กรุณาวิเคราะห์ค่าใช้จ่ายและรายรับทั้งหมด และช่วยเสนอตัวเลข 'งบประมาณรายวัน' และ 'งบประมาณรายเดือน' ที่สมเหตุสมผลที่สุดเพื่อเพิ่มเงินออม พร้อมให้เหตุผลทางเศรษฐศาสตร์สนับสนุน`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "คุณคือที่ปรึกษาการวางแผนงบประมาณอัจฉริยะที่ใช้หลักการ 50/30/20 Rule และพฤติกรรมการใช้จ่ายจริงเพื่อช่วยตั้งงบประมาณที่ดีที่สุด",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDailyBudget: { type: Type.NUMBER, description: "ตัวเลขงบประมาณรายวันที่แนะนำ (บาท) จำนวนเต็ม" },
            recommendedMonthlyBudget: { type: Type.NUMBER, description: "ตัวเลขงบประมาณรายเดือนที่แนะนำ (บาท) จำนวนเต็ม" },
            justification: { type: Type.STRING, description: "เหตุผลที่สนับสนุนการตั้งงบประมาณนี้และอธิบายว่าปรับปรุงจากของเดิมอย่างไร" },
            savingsGoalPercent: { type: Type.NUMBER, description: "เป้าหมายการออมเงินร้อยละเท่าไรของรายรับทั้งหมดที่จะได้รับหากใช้ตามงบนี้" }
          },
          required: ["recommendedDailyBudget", "recommendedMonthlyBudget", "justification", "savingsGoalPercent"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API for budget recommendation");
    }

    const result = JSON.parse(resultText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in budget recommendation API:", error);
    res.status(500).json({ error: error.message || "Failed to generate budget recommendation" });
  }
});

// Setup Vite development server or production build static folder
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
