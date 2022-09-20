from typing import Optional, Any

import yaml
from django.contrib.gis.db import models
from django import forms


class ConfigField(forms.JSONField):
    empty_values = [None, "", [], ()]

    def to_python(self, value: Optional[Any]) -> Optional[Any]:
        value = yaml.safe_load(value) or dict()
        return super().to_python(value)


class ConfigJSONField(models.JSONField):
    def formfield(self, **kwargs):
        return super().formfield(**{"form_class": ConfigField, **kwargs})
