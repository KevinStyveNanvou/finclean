# ia/services/ai_service.py
import requests
from django.conf import settings


def call_llm(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "llama-3.3-70b-versatile",  # modèle actif Groq 2026
        "messages": [
            {
                "role": "system",
                "content": (
                    "Tu es un expert senior en cybersécurité spécialisé dans "
                    "les institutions financières. Tu analyses les vulnérabilités, "
                    "CVE, scores CVSS, et risques métier. Tes réponses sont "
                    "précises, structurées et orientées action."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
    }

    response = requests.post(url, json=data, headers=headers, timeout=30)
    result = response.json()

    if response.status_code != 200:
        error_msg = result.get("error", {}).get("message", str(result))
        raise ValueError(f"Groq API {response.status_code}: {error_msg}")

    if "choices" not in result:
        raise ValueError(f"Réponse Groq inattendue: {result}")

    return result["choices"][0]["message"]["content"]