# Synthesys | AI Documentation Platform

Synthesys is a next-generation knowledge management platform that uses **Retrieval Augmented Generation (RAG)** to turn your static documents into an interactive expert assistant.

## How it's Built

### Core Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) for high-performance server-side rendering and client-side interactivity.
- **AI Orchestration**: [Google Genkit](https://github.com/firebase/genkit) - A framework for building production-ready AI features.
- **LLM Model**: **Gemini 2.5 Flash** - Chosen for its high speed, multi-modal capabilities (native PDF processing), and strong reasoning.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for responsive, modern design.
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) based on Radix UI primitives.
- **Icons**: [Lucide React](https://lucide.dev/).

### Architecture
1. **Document Processing**: When you upload a PDF or text file, a **Genkit Flow** extracts the text, cleans up binary noise, and generates a concise summary.
2. **Chunking**: The document is split into smaller, meaningful text segments (chunks) for precise information retrieval.
3. **Retrieval Augmented Generation (RAG)**: When you ask a question, the app finds the most relevant chunks and passes them to Gemini along with your query to ensure the answer is grounded in *your* data.
4. **Citations**: The AI identifies exactly which document segments were used to generate the answer, providing transparency and trust.

## Key Features
- **Native PDF Extraction**: Direct processing of PDF data using Gemini's multi-modal vision.
- **Knowledge Indexing**: Automatic summarization and chunking for expert Q&A.
- **Multilingual Support**: Optimized for English communication.
- **Advanced Error Handling**: Graceful management of Gemini Free Tier rate limits.
