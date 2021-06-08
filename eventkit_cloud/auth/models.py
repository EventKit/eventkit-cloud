from django.contrib.auth.models import User
from django.db import models
from django.conf import settings
from django.db import models
from django.contrib.sessions.models import Session

from eventkit_cloud.core.models import update_all_attribute_classes_with_user


class OAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=False)
    identification = models.CharField(max_length=200, unique=True, blank=False)
    commonname = models.CharField(max_length=100, blank=False)
    user_info = models.JSONField(default=dict)

    class Meta:  # pragma: no cover
        managed = True
        db_table = "auth_oauth"

    def save(self, *args, **kwargs):
        super(OAuth, self).save(*args, **kwargs)
        # Need to ensure the user is granted access to the correct resources.
        update_all_attribute_classes_with_user(self.user)

    def __str__(self):
        return "{0}".format(self.commonname)


class UserSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session = models.ForeignKey(Session, on_delete=models.CASCADE)
