import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

export async function POST(req: NextRequest) {
  try {
    const { visual } = await req.json();

    const imageBlob = await client.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: `${visual}, cinematic, professional photography, high quality, 4k`,
      parameters: {
        num_inference_steps: 4,
        width: 1024,
        height: 576,
      },
    });

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    const base64 = buffer.toString("base64");
    const imageUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error("HF Error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "حدث خطأ" },
      { status: 500 }
    );
  }
}