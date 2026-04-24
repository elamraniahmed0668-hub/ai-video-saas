import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, language } = await req.json();

    const languageMap: Record<string, string> = {
      ar: "العربية",
      fr: "الفرنسية",
      en: "الإنجليزية",
      es: "الإسبانية",
    };

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `أنت خبير في كتابة سكريبتات فيديوهات إعلانية احترافية.
اكتب السكريبت باللغة ${languageMap[language] || "العربية"}.
قسّم السكريبت لـ 4 مشاهد فقط.
أعطِ الرد بصيغة JSON هكذا بالضبط:
{
  "title": "عنوان الفيديو",
  "scenes": [
    {
      "id": 1,
      "voiceover": "النص المنطوق",
      "visual": "short visual description in English"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `أنشئ سكريبت فيديو إعلاني احترافي عن: ${prompt}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const script = JSON.parse(
      completion.choices[0].message.content || "{}"
    );

    return NextResponse.json({ success: true, script });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء توليد السكريبت" },
      { status: 500 }
    );
  }
}