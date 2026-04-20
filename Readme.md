# MultiModal-Context-Aware-Document-Understanding

An intelligent document understanding system that extracts text, images, and tables from documents, generates embeddings, and provides AI-powered question-answering capabilities.

Overcomes traditional RAG limitations by going beyond text-only retrieval to capture complete document insights.

## Pipeline

![Image Table Processing Pipeline](screenshots/ImageTableProcessingPipeline.png)

## Features

### Document Processing
- **Text Extraction**: Automatically extracts and chunks text content from uploaded documents
- **Image Captioning**: Detects images in documents and generates detailed descriptions using GPT-4
- **Table Understanding**: Identifies tables and generates detailed descriptions of their structure and insights

### Pros and Cons

**Pros:**
- **Separated Metadata**: Images and tables have dedicated metadata fields, enabling precise filtering and targeted queries
- **Easy to Implement**:  A straightforward pipeline.
- **Rich Context**: Image captions and table descriptions add meaningful context to vector search results
- **Source Traceability**: Every retrieved chunk includes metadata (filename, page number, element type) for easy verification

**Cons:**
- **Cost for Image-Heavy PDFs**: Documents with many images require multiple GPT-4 calls for captioning, which can become expensive
- **Processing Time**: Image and table analysis adds latency to the ingestion pipeline (Imagine if we have to ingest 1000-3000pages documents)

### AI Capabilities
- **Semantic Search**: Find relevant content across all uploaded documents using vector embeddings
- **Context-Aware Q&A**: Get accurate answers grounded in your document content
- **Source Citations**: Every answer includes references to the original source documents
- **Multi-Format Support**: Works with PDFs, text files, CSVs, HTML, and more

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - UI components built on Radix UI
- **Framer Motion** - Animations
- **React Markdown** - Markdown rendering for AI responses

### Backend
- **FastAPI** - Python REST API
- **LangChain** - RAG orchestration
- **Qdrant** - Vector database for embeddings
- **OpenAI** - GPT-4 for image/table analysis and chat completions
- **Unstructured API** - Document parsing and element extraction
- **Prisma** - Database ORM

## Project Structure

```
COLLEGE_MINI_PROJECT/
├── frontend/                 # Next.js React application
│   ├── app/                  # App Router pages and layouts
│   ├── components/           # React components (ChatPanel, etc.)
│   ├── lib/                  # Utilities and helpers
│   └── types/                # TypeScript type definitions
├── ai-backend/               # FastAPI backend
│   ├── main.py               # API endpoints (upload, chat, delete)
│   ├── ingestion.py          # Document ingestion pipeline
│   ├── chunking.py           # Text chunking and processing
│   └── research_codes/       # Research and utility scripts
└── screenshots/              # Project screenshots
```

## How It Works

### Landing Page
Welcome screen with project overview and quick actions.

![Landing Page](screenshots/LandingPage.png)

### 1. Create Project
Start by creating a new project to organize your documents.

![Create Project](screenshots/CreateProject.png)

### 2. Upload Documents
Upload your documents (PDF, TXT, CSV, etc.). The file is saved and an ingestion job is created automatically.

![Project Dashboard](screenshots/ProjectDashBoard.png)

### 3. Document Processing Pipeline
Watch real-time processing status as your document goes through the pipeline:

```
upload_received → chunking → embeddings → vector_storage → ready
```

![Live Ingestion](screenshots/LiveIngestion.png)

**Chunking Stage:**
- Document sent to Unstructured API for element extraction
- Text elements are split into 1000-character chunks with 200-character overlap
- Images are extracted with captions and analyzed by GPT-4
- Tables are converted to HTML and described by GPT-4

**Embeddings Stage:**
- Each chunk is embedded using OpenAI's text-embedding-3-large model
- Vectors are stored in Qdrant with metadata (filename, page number, type, caption)

### 4. Ask Questions
Chat with your documents using the AI-powered chat interface. Get accurate answers with source citations.

![Chat Panel](screenshots/ChatPanel.png)

- User query is embedded and matched against vector database
- Top 6 most relevant chunks are retrieved
- GPT-4 generates an answer using only the provided context
- Response includes citations to source documents

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Qdrant vector database (running on localhost:6333)
- OpenAI API key
- Unstructured API key

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Unstructured API
UNSTRUCTURED_API_KEY=your_unstructured_api_key

# Qdrant
QDRANT_URL=http://localhost:6333

# Next.js
NEXTJS_URL=http://localhost:3000
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd COLLEGE_MINI_PROJECT
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Set up backend virtual environment**
```bash
cd ai-backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

4. **Start Qdrant** (if not already running)
```bash
docker run -p 6333:6333 qdrant/qdrant
```

5. **Start the development servers**

Terminal 1 - Backend:
```bash
cd ai-backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

6. **Open the application**
Navigate to `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload a document for processing |
| POST | `/chat` | Send a question and get AI-powered answer |
| GET | `/files/{project_id}/{document_name}` | Serve document files |
| DELETE | `/documents/{document_id}/delete` | Delete document from vector DB |