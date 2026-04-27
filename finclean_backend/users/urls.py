from django.urls import path
from .views import current_user,logout_view,login_view,register_user,refresh_token_view
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_view, name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_view, name='logout'),
    path('me/', current_user),
    path('refresh/', refresh_token_view),
]