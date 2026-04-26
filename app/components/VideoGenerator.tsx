"use client";

import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

interface Scene {
  id: number;
  voiceover: string;
  visual: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface Props {
  scenes: Scene[];
}

export default function VideoGenerator({ scenes }: Props) {
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const readyScenes = scenes.filter((s) => s.imageUrl && s.audioUrl);

  const handleGenerate = async () => {
    if (readyScenes.length === 0) return;

    setGenerating(true);
    setProgress(0);
    setVideoUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;

      // تحميل FFmpeg
      if (!ffmpeg.loaded) {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
      }

      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      // كتابة ملفات كل مشهد
      for (let i = 0; i < readyScenes.length; i++) {
        const scene = readyScenes[i];

        // كتابة الصورة
        const imgData = scene.imageUrl!.split(",")[1];
        const imgBytes = Uint8Array.from(atob(imgData), (c) => c.charCodeAt(0));
        await ffmpeg.writeFile(`img${i}.jpg`, imgBytes);

        // كتابة الصوت
        const audioRes = await fetch(scene.audioUrl!);
        const audioBytes = new Uint8Array(await audioRes.arrayBuffer());
        await ffmpeg.writeFile(`audio${i}.mp3`, audioBytes);

        // دمج صورة + صوت لكل مشهد
        await ffmpeg.exec([
          "-loop", "1",
          "-i", `img${i}.jpg`,
          "-i", `audio${i}.mp3`,
          "-c:v", "libx264",
          "-tune", "stillimage",
          "-c:a", "aac",
          "-b:a", "192k",
          "-shortest",
          "-pix_fmt", "yuv420p",
          `scene${i}.mp4`,
        ]);
      }

      // دمج كل المشاهد في فيديو واحد
      const concatList = readyScenes
        .map((_, i) => `file 'scene${i}.mp4'`)
        .join("\n");
      await ffmpeg.writeFile("concat.txt", concatList);

      await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",
        "output.mp4",
      ]);

      // قراءة الفيديو النهائي
      const data = await ffmpeg.readFile("output.mp4");
      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error("FFmpeg Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "video.mp4";
    a.click();
  };

  return (
    <div className="mt-6 w-full">
      {/* معلومات المشاهد الجاهزة */}
      <p className="text-center text-gray-400 text-sm mb-4">
        {readyScenes.length} / {scenes.length} مشاهد جاهزة (صورة + صوت)
      </p>

      {/* زر توليد الفيديو */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={generating || readyScenes.length === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2"
        >
          <span>{generating ? "⏳" : "🎬"}</span>
          <span>{generating ? `جارٍ التوليد... ${progress}%` : "ولّد الفيديو النهائي"}</span>
        </button>
      </div>

      {/* شريط التقدم */}
      {generating && (
        <div className="mt-4 w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* الفيديو النهائي */}
      {videoUrl && (
        <div className="mt-6">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-xl border border-white/10"
          />
          <div className="flex justify-center mt-4">
            <button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 transition-all duration-200 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2"
            >
              <span>⬇️</span>
              <span>تحميل الفيديو</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}