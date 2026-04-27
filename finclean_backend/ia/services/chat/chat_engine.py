# ai/services/chat/chat_engine.py

from ..rag.context_builder import build_context
from ..ai_service import call_llm

def chat(query):
    context = build_context(query)

    prompt = f"""
    You are a cybersecurity assistant.

    Context from Exploit-DB:
    {context}

    User question:
    {query}

    Answer clearly and professionally.
    """

    return call_llm(prompt)