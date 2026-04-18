# 📄 RAG PDF Chat App

A Retrieval-Augmented Generation (RAG) system that allows users to upload PDFs and ask questions.

## 🚀 Features
- Upload PDF
- Ask questions
- Context-based answers
- Fast retrieval using FAISS

## 🛠️ Tech Stack
- Frontend: Next.js
- Backend: FastAPI
- LLM: Ollama (phi)
- Vector DB: FAISS

## ▶️ Run Locally

### Backend
```bash
uvicorn main:app --reload

### Frontend
npm install
npm run dev

Requirements
ollama pull phi

---