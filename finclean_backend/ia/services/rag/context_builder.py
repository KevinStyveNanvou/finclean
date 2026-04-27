# ai/services/rag/context_builder.py

from ..retrieval import search_exploits

def build_context(query):
    results = search_exploits(query, k=5)
    context = "\n\n".join(results)
    return context