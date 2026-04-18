"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSources, setLastSources] = useState<string[]>([]);

  const API_URL = "http://localhost:8000";

  const uploadPDF = async () => {
    if (!file) return alert("Select a PDF first");

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    alert("✅ PDF processed successfully!");
  };

  const askQuestion = async () => {
    if (!question) return;

    setChat((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/ask?question=${encodeURIComponent(question)}`
      );

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        { role: "bot", text: data.answer || data.error },
      ]);

      setLastSources(data.sources || []);
    } catch (err) {
      setChat((prev) => [
        ...prev,
        { role: "bot", text: "❌ Backend not reachable" },
      ]);
    }

    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="h-screen grid grid-cols-[280px_1fr_300px] bg-slate-950 text-white">
      {/* LEFT PANEL */}
      <div className="p-5 border-r border-slate-800 flex flex-col gap-6">
        <h2 className="text-xl font-bold">📄 Document Analyzer</h2>

        {/* Upload Box */}
        <div className="bg-slate-900 p-4 rounded-xl shadow">
          <h3 className="mb-3 font-semibold">Upload PDF</h3>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition">
            <span className="text-sm opacity-70">Click or drag file</span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {file && (
            <p className="text-xs mt-2 opacity-70">📎 {file.name}</p>
          )}

          <button
            onClick={uploadPDF}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition"
          >
            Process Document
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div className="flex flex-col p-5">
        <h2 className="text-lg mb-3 font-semibold">Ask your document</h2>

        <div className="flex-1 overflow-y-auto bg-slate-900 rounded-xl p-4 space-y-3">
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[70%] p-3 rounded-xl text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-blue-500 text-white"
                  : "bg-slate-200 text-black"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <p className="text-sm opacity-60">Analyzing document...</p>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 p-3 rounded-lg bg-slate-800 border border-slate-700"
          />
          <button
            onClick={askQuestion}
            className="bg-blue-600 px-4 rounded-lg hover:bg-blue-700"
          >
            Ask
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="p-5 border-l border-slate-800">
        <h3 className="font-semibold mb-3">Context</h3>

        <div className="space-y-2 overflow-y-auto max-h-[70vh]">
          {lastSources.length === 0 ? (
            <p className="text-sm opacity-50">No context yet</p>
          ) : (
            lastSources.map((s, i) => (
              <div
                key={i}
                className="bg-slate-900 p-2 rounded-lg text-xs opacity-80"
              >
                {s}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}