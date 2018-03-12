from django.contrib.auth.models import User,Group
from django.db import models
from django.contrib.postgres.fields import JSONField
from ..core.models import TimeStampedModelMixin, UIDMixin


class OAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=False)
    identification = models.CharField(max_length=200, unique=True, blank=False)
    commonname = models.CharField(max_length=100, blank=False)
    user_info = JSONField(default={})

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'auth_oauth'

    # https://stackoverflow.com/questions/12754024/onetoonefield-and-deleting
    def delete(self, *args, **kwargs):
        self.user.delete()
        return super(self.__class__, self).delete(*args, **kwargs)

    def __str__(self):
        return '{0}'.format(self.commonname)
