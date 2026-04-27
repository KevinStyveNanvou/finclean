from rest_framework import serializers
from django.contrib.auth import get_user_model
from scans.models import Scan
User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "date_joined",
            "is_active"
        ]


class ScansSerializer(serializers.ModelSerializer):

    class Meta:
        model = Scan
        fields = [
            "id",
            "user",
            "target",
            "begin_at",
            "status"
        ]