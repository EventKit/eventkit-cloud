from typing import Any, Optional

import yaml
from django import forms
from django.contrib.gis.db import models


class ConfigField(forms.JSONField):
    empty_values = [None, "", [], ()]

    def to_python(self, value: Optional[Any]) -> Optional[Any]:
        value = yaml.safe_load(value) or dict()
        return super().to_python(value)


class ConfigJSONField(models.JSONField):
    def formfield(self, **kwargs):
        return super().formfield(**{"form_class": ConfigField, **kwargs})
