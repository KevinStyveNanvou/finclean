# scans/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class CookieJWTAuthentication(JWTAuthentication):
    """
    Authentification JWT qui vérifie d'abord les cookies, puis les headers
    """
    def authenticate(self, request):
        # Essayer d'abord de récupérer le token depuis les cookies
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            try:
                # Valider le token
                validated_token = self.get_validated_token(access_token)
                
                # Récupérer l'utilisateur
                user = self.get_user(validated_token)
                
                # Ajouter le token à la requête pour référence future
                request.successful_authenticator = self
                
                return (user, validated_token)
            except Exception as e:
                print(f"Erreur authentification cookie: {e}")
        
        # Si pas de cookie, essayer l'authentification standard (headers)
        return super().authenticate(request)