# import faiss
# import pickle
# import numpy as np
# from sentence_transformers import SentenceTransformer

# INDEX_PATH = "ai/data/exploitdb.index"
# TEXTS_PATH = "ai/data/exploitdb_texts.pkl"

# # Chargement global (important)
# model = SentenceTransformer("all-MiniLM-L6-v2")
# index = faiss.read_index(INDEX_PATH)

# with open(TEXTS_PATH, "rb") as f:
#     texts = pickle.load(f)


# def search_exploits(query, k=5):
#     query_vector = model.encode([query])
#     distances, indices = index.search(np.array(query_vector), k)

#     return [texts[i] for i in indices[0]]

def search_exploits(query, k=5):
    return ['hello world', 'exploit 1', 'exploit 2']