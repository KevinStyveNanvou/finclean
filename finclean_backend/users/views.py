from rest_framework.views import APIView
from rest_framework import generics
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model, authenticate
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging
logger = logging.getLogger(__name__)



User = get_user_model()

# scans/views.py (ou votre fichier de vues)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Vue de login qui retourne les tokens et les place dans des cookies HTTP-only
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Veuillez fournir un nom d\'utilisateur et un mot de passe'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user is not None:
        # Générer les tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Créer la réponse
        response = Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            "cookies":{
                "access_token":access_token,
                "refresh_token":refresh_token
            }
        }, status=status.HTTP_200_OK)

        # Définir les cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=False,  # Mettre True en production
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600,  # 1 heure
            path='/',
        )

        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=False,  # Mettre True en production
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=86400,  # 24 heures
            path='/',
        )

        # Ajouter le token CSRF
        response.set_cookie(
            key='csrftoken',
            value=get_token(request),
            httponly=False,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/',
        )

        return response

    return Response(
        {'error': 'Nom d\'utilisateur ou mot de passe incorrect'},
        status=status.HTTP_401_UNAUTHORIZED
    )
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    try:
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()  # 🔥 invalide définitivement le token

            logger.info("Refresh token blacklisted successfully")

        else:
            logger.warning("No refresh token found in cookies")

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")

    response = Response(
        {"message": "Logout successful"},
        status=status.HTTP_200_OK
    )

    # 🔥 IMPORTANT : supprimer les cookies côté serveur
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')

    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """
    Rafraîchir le token d'accès
    """
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token manquant'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)

        response = Response({'message': 'Token refreshed'})

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=False,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=3600,
            path='/',
        )

        return response

    except Exception as e:
        return Response(
            {'error': 'Token invalide'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Récupérer l'utilisateur courant
    """
    user = request.user
    return Response({
        'id': user.id,
        'role': user.role,
        'institution': user.institution,
        'username': user.username,
        'email': user.email
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    """
    Fonction pour enregistrer un nouvel utilisateur.
    """
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    role = request.data.get("role", "analyst")  # Valeur par défaut : analyst
    institution = request.data.get("company", "")

    if not username or not email or not password:
        return Response(
            {"error": "username, email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role,
        institution=institution
    )

    # Générer JWT directement
    refresh = RefreshToken.for_user(user)

    return Response({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "institution": user.institution
        },
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }, status=status.HTTP_201_CREATED)
