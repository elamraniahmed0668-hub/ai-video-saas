"use client";

import { useState } from "react";

interface Scene {
  id: number;
  voiceover: string;
  visual: string;
  imageUrl?: string;
}

interface Script {
  title: string;
  scenes: Scene[];
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("ar");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setScript(null);

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });
      const data = await res.json();
      if (data.success) {
        setScript(data.script);
      } else {
        setError(data.error);
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!script) return;
    setLoadingImages(true);

    const updatedScenes = await Promise.all(
      script.scenes.map(async (scene) => {
        try {
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visual: scene.visual }),
          });
          const data = await res.json();
          return { ...scene, imageUrl: data.success ? data.imageUrl : undefined };
        } catch {
          return scene;
        }
      })
    );

    setScript({ ...script, scenes: updatedScenes });
    setLoadingImages(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-4">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1 text-purple-400 text-sm mb-6">
          🎬 AI Video Generator
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-500 bg-clip-text text-transparent">
          أنشئ فيديوهات احترافية
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          حوّل أفكارك لفيديوهات ترويجية باستخدام الذكاء الاصطناعي في ثوانٍ
        </p>
      </div>

      {/* Input Box */}
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب فكرتك هنا... مثال: فيديو إعلاني لمنتج عطر فاخر"
          className="w-full bg-transparent text-white placeholder-gray-500 text-right resize-none outline-none text-lg h-32"
          dir="rtl"
        />
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl px-4 py-2 text-white text-sm outline-none cursor-pointer"
          >
            <option value="ar" className="bg-[#1a1a2e] text-white">🇲🇦 العربية</option>
            <option value="fr" className="bg-[#1a1a2e] text-white">🇫🇷 Français</option>
            <option value="en" className="bg-[#1a1a2e] text-white">🇬🇧 English</option>
            <option value="es" className="bg-[#1a1a2e] text-white">🇪🇸 Español</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white font-semibold px-8 py-2 rounded-xl flex items-center gap-2"
          >
            <span>{loading ? "⏳" : "✨"}</span>
            <span>{loading ? "جارٍ التوليد..." : "أنشئ الفيديو"}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 w-full max-w-2xl bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Script Result */}
      {script && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-4 text-purple-300">
            🎬 {script.title}
          </h2>

          {/* Generate Images Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleGenerateImages}
              disabled={loadingImages}
              className="bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50 transition-all duration-200 text-white font-semibold px-8 py-2 rounded-xl flex items-center gap-2"
            >
              <span>{loadingImages ? "⏳" : "🖼️"}</span>
              <span>{loadingImages ? "جارٍ توليد الصور..." : "ولّد صور المشاهد"}</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {script.scenes?.map((scene) => (
              <div
                key={scene.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Scene Image */}
                {scene.imageUrl && (
                  <img
                    src={scene.imageUrl}
                    alt={scene.visual}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="text-purple-400 text-sm font-semibold mb-2">
                    مشهد {scene.id}
                  </div>
                  <p className="text-white text-right leading-relaxed mb-3" dir="rtl">
                    {scene.voiceover}
                  </p>
                  <p className="text-gray-500 text-sm italic">
                    🎥 {scene.visual}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-gray-600 text-sm mt-8 mb-8">
        مجاني تماماً • جودة عالية • متعدد اللغات
      </p>

    </main>
  );
}