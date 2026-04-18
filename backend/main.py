from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.llms import Ollama
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os

app = FastAPI()

# ---------------------------
# ✅ CORS FIX (IMPORTANT)
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# ✅ SAFE OLLAMA INIT
# ---------------------------
try:
    llm = Ollama(model="phi")
except Exception as e:
    print("⚠️ Ollama not loaded:", e)
    llm = None

# ---------------------------
# ✅ EMBEDDINGS
# ---------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = None


# ---------------------------
# HOME ROUTE
# ---------------------------
@app.get("/")
def home():
    return {"message": "RAG System Running"}


# ---------------------------
# UPLOAD PDF
# ---------------------------
@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global db

    os.makedirs("data", exist_ok=True)
    file_path = f"data/{file.filename}"

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Load PDF
    loader = PyPDFLoader(file_path)
    raw_docs = loader.load()

    # Chunking
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )
    docs = splitter.split_documents(raw_docs)

    # FAISS vector DB
    db = FAISS.from_documents(docs, embeddings)

    return {"message": "PDF uploaded & processed successfully"}


# ---------------------------
# ASK QUESTION
# ---------------------------
@app.get("/ask")
def ask(question: str):
    global db, llm

    try:
        if db is None:
            return {"error": "Upload a PDF first"}

        if llm is None:
            return {"error": "Ollama model not loaded"}

        # Retrieve relevant chunks
        docs = db.similarity_search(question, k=3)

        context = "\n\n".join([
    doc.page_content for doc in docs
])

        prompt = f"""
You are a strict document question-answering assistant.

RULES:
1. Use ONLY the given context.
2. If the answer is not explicitly present, say:
   "Not found in the document."
3. Do NOT guess.
4. Do NOT infer topics.
5. Do NOT summarize the whole document.
6. Only answer what is directly asked.

Context:
{context}

Question:
{question}

Answer:
"""

        answer = llm.invoke(prompt)

        return {
            "answer": answer.strip(),
            "sources": [doc.page_content[:200] for doc in docs]
        }
        

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}