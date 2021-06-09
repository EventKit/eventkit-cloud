from django.contrib.auth.signals import user_logged_in

from eventkit_cloud.auth.models import UserSession


def user_logged_in_handler(sender, request, user, **kwargs):
    UserSession.objects.get_or_create(user=user, session_id=request.session.session_key)


user_logged_in.connect(user_logged_in_handler)
