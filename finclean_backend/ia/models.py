# ia/models.py
from django.db import models
from users.models import CustomUser


class Conversation(models.Model):
    """Une session de chat entre un utilisateur et l'IA."""

    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"[{self.user.username}] {self.title or 'Conversation ' + str(self.id)}"

    def generate_title(self):
        """Génère un titre automatique depuis le premier message user."""
        first_msg = self.messages.filter(role='user').first()
        if first_msg:
            self.title = first_msg.content[:80]
            self.save(update_fields=['title'])


class Message(models.Model):
    """Un message individuel dans une conversation."""

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('analyst', 'Analyst'),
        ('auditor', 'Auditor'),
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField(default='')
    created_at = models.DateTimeField(auto_now_add=True)


    # Métadonnées optionnelles pour le suivi
    model_used = models.CharField(max_length=100, blank=True, default='')
    tokens_used = models.IntegerField(null=True, blank=True)
    context_used = models.TextField(blank=True, default='')  # RAG context injecté

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        preview = self.content[:60] + '...' if len(self.content) > 60 else self.content
        return f"[{self.role}] {preview}"