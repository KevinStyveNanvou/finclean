# users/models.py
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('analyst', 'Analyst'),
        ('auditor', 'Auditor'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='analyst')
    institution = models.CharField(max_length=255, blank=True, null=True)

    #  redéfinir les relations M2M pour éviter les conflits
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',  # <-- évite le conflit avec auth.User.groups
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_permissions_set',  # <-- évite le conflit
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions'
    )

    def __str__(self):
        return self.username