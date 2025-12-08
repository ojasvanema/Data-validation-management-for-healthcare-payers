import os
from typing import List, Dict, Any, Optional
from backend.tools import DEFAULT_TOOLS
from backend.utils import clean_text, chunk_text
from backend.indexer import EmbeddingModel, FaissIndexer
import numpy as np

class ToolNotFound(Exception):
    pass

class DocumentAgent:
    def __init__(self, tools: Optional[List] = None, embedding_model_name: str = "all-MiniLM-L6-v2", chunk_size: int = 1000, chunk_overlap: int = 200):
        self.tools = tools or DEFAULT_TOOLS
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedder = EmbeddingModel(embedding_model_name)
        self.faiss = None
        self.dimension = None

    def pick_tool(self, file_path: str):
        for t in self.tools:
            try:
                if t.can_handle(file_path):
                    return t
            except Exception:
                continue
        raise ToolNotFound(f"No tool registered for {file_path}")

    def ingest_file(self, file_path: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        try:
            tool = self.pick_tool(file_path)
            parsed = tool.parse(file_path)
            text = parsed.get('text', '')
            text = clean_text(text)
            
            if not text:
                return {'parsed': parsed, 'chunks': 0, 'status': 'no text extracted'}

            chunks = chunk_text(text, self.chunk_size, self.chunk_overlap)
            # embed chunks
            vectors = self.embedder.embed(chunks)
            if vectors.size > 0:
                if self.faiss is None:
                    self.dimension = vectors.shape[1]
                    self.faiss = FaissIndexer(self.dimension)
                
                metadatas = [{'doc_id': doc_id or os.path.basename(file_path), 'chunk_index': i, 'text': chunks[i]} for i in range(len(chunks))]
                self.faiss.add(vectors, metadatas)
                
            return {'parsed': parsed, 'chunks': len(chunks), 'status': 'success'}
        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def semantic_search(self, query: str, top_k: int = 5):
        if self.faiss is None:
            return []
        qvec = self.embedder.embed([query])[0]
        res = self.faiss.search(qvec, top_k)
        return res

    def query_with_context(self, query: str, top_k: int = 5) -> str:
        results = self.semantic_search(query, top_k=top_k)
        if not results:
            return "No documents indexed."
        
        hits = results[0]
        context = "\n\n".join([h['meta']['text'] for h in hits])
        return context
