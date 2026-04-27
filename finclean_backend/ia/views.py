# ia/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ia.services.chat.chat_engine import chat
from ia.services.analyts.vulnerability_analyzer import analyze_vulnerability
from ia.services.reporting.report_generator import generate_report
from ia.models import Conversation, Message


# ─── CHAT ────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    """
    Envoie un message et sauvegarde la conversation.
    Body: { "query": "...", "conversation_id": 123 (optionnel) }
    """
    query = request.data.get("query", "").strip()
    conversation_id = request.data.get("conversation_id")

    if not query:
        return Response({"error": "Le champ 'query' est requis."}, status=status.HTTP_400_BAD_REQUEST)

    # Récupérer ou créer la conversation
    if conversation_id:
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        except Conversation.DoesNotExist:
            return Response({"error": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)
    else:
        conversation = Conversation.objects.create(user=request.user)

    # Sauvegarder le message user
    Message.objects.create(
        conversation=conversation,
        role=request.user.role,  # 'admin', 'analyst' ou 'auditor' selon le rôle de l'utilisateur
        content=query,
    )

    # Appel LLM
    response_text = chat(query)

    # Sauvegarder la réponse assistant
    Message.objects.create(
        conversation=conversation,
        role=request.user.role,  # ou 'assistant' selon votre choix de rôle
        content=response_text,
        model_used='llama-3.3-70b-versatile',
    )

    # Générer le titre depuis le premier message si pas encore défini
    if not conversation.title:
        conversation.generate_title()

    return Response({
        "response": response_text,
        "conversation_id": conversation.id,
        "conversation_title": conversation.title,
    })


# ─── HISTORIQUE DES CONVERSATIONS ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_list_view(request):
    """
    Retourne la liste des conversations de l'utilisateur connecté.
    GET /api/ia/conversations/
    """
    conversations = Conversation.objects.filter(user=request.user).values(
        'id', 'title', 'created_at', 'updated_at'
    )
    return Response(list(conversations))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_detail_view(request, conversation_id):
    """
    Retourne tous les messages d'une conversation.
    GET /api/ia/conversations/<conversation_id>/
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)

    messages = conversation.messages.values(
        'id', 'role', 'content', 'created_at', 'model_used'
    )

    return Response({
        "conversation": {
            "id": conversation.id,
            "title": conversation.title,
            "created_at": conversation.created_at,
            "updated_at": conversation.updated_at,
        },
        "messages": list(messages),
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def conversation_delete_view(request, conversation_id):
    """
    Supprime une conversation et tous ses messages.
    DELETE /api/ia/conversations/<conversation_id>/
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        conversation.delete()
        return Response({"message": "Conversation supprimée."}, status=status.HTTP_204_NO_CONTENT)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation introuvable."}, status=status.HTTP_404_NOT_FOUND)


# ─── AUTRES VUES ──────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_view(request):
    vuln = request.data.get("vulnerability")
    return Response({"analysis": analyze_vulnerability(vuln)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_view(request):
    vulns = request.data.get("vulnerabilities")
    return Response({"report": generate_report(vulns)})