import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { visual } = await req.json();

    const encodedPrompt = encodeURIComponent(
      `${visual}, cinematic, professional photography, high quality, 4k`
    );

    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&nologo=true&enhance=true&seed=${Date.now()}`;

    const response = await fetch(pollinationsUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "فشل توليد الصورة" },
        { status: 500 }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}