import numpy as np
from typing import List, Dict, Any

class EmbeddingModel:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        pass

    def embed(self, texts: List[str]) -> np.ndarray:
        # Return random vectors for now to avoid heavy ML dependencies
        return np.random.rand(len(texts), 384).astype('float32')

class FaissIndexer:
    def __init__(self, dim: int):
        self.dim = dim
        self.vectors = []
        self.metadata = [] 

    def add(self, vectors: np.ndarray, metadatas: List[Dict[str, Any]]):
        for v, m in zip(vectors, metadatas):
            self.vectors.append(v)
            self.metadata.append(m)

    def search(self, qvec: np.ndarray, top_k: int = 5):
        # Mock search: just return the first k items
        results = []
        row = []
        for i, meta in enumerate(self.metadata[:top_k]):
             row.append({'score': 0.99, 'meta': meta})
        results.append(row)
        return results
