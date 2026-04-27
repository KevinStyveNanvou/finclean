import chromadb
from chromadb.config import Settings

CHROMA_PATH = "vector_db"

def get_client():
    return chromadb.Client(
        Settings(
            persist_directory=CHROMA_PATH,
            is_persistent=True
        )
    )