from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from typing import List, Dict, Any

class EmbeddingModel:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
    def embed(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.array([])
        return self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)

class FaissIndexer:
    def __init__(self, dim: int):
        self.dim = dim
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []  # parallel list to hold metadata per vector

    def add(self, vectors: np.ndarray, metadatas: List[Dict[str, Any]]):
        if vectors.ndim == 1:
            vectors = vectors.reshape(1, -1)
        if vectors.shape[0] == 0:
            return
        assert vectors.shape[1] == self.dim
        self.index.add(vectors.astype('float32'))
        self.metadata.extend(metadatas)

    def search(self, qvec: np.ndarray, top_k: int = 5):
        if qvec.ndim == 1:
            qvec = qvec.reshape(1, -1)
        D, I = self.index.search(qvec.astype('float32'), top_k)
        results = []
        for dlist, ilist in zip(D, I):
            row = []
            for d, i in zip(dlist, ilist):
                if i != -1 and i < len(self.metadata):
                    row.append({'score': float(d), 'meta': self.metadata[i]})
            results.append(row)
        return results
