from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/scans/", include("scans.urls")),
    path("api/user/", include("users.urls")),
    path("api/ia/", include("ia.urls")),
    path("api/admin/", include("platform_admin.urls")),
]