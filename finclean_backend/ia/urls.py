# ia/urls.py
from django.urls import path
from ia import views

urlpatterns = [
    path('chat/',                                    views.chat_view,                 name='ia-chat'),
    path('conversations/',                           views.conversation_list_view,    name='ia-conversations'),
    path('conversations/<int:conversation_id>/',     views.conversation_detail_view,  name='ia-conversation-detail'),
    path('conversations/<int:conversation_id>/delete/', views.conversation_delete_view, name='ia-conversation-delete'),
    path('analyze/',                                 views.analyze_view,              name='ia-analyze'),
    path('report/',                                  views.report_view,               name='ia-report'),
]