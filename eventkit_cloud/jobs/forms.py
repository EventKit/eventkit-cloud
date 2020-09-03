import logging

from django.contrib.gis import forms
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


class RegionForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super(RegionForm, self).__init__(*args, **kwargs)

    def clean_policies(self):
        data = self.cleaned_data["policies"]
        policies = data.get("policies")

        if not policies:
            raise ValidationError("Must include policies object, please see the example above.")

        for policy in policies:
            title = policy.get("title")
            description = policy.get("description")

            if not title:
                raise ValidationError("Every policy must have a title.")
            if not description:
                raise ValidationError("Every policy must have a description.")

        return data

    def clean_justification_options(self):
        data = self.cleaned_data["justification_options"]
        justification_options = data.get("justification_options")

        if not justification_options:
            raise ValidationError("Must include justification_options object, please see the example above.")

        for justification_option in justification_options:
            option_id = justification_option.get("id")
            name = justification_option.get("name")
            display = justification_option.get("display")
            suboption = justification_option.get("suboption")

            if not option_id:
                raise ValidationError("Every option must have an id.")
            if type(option_id) is not int:
                raise ValidationError("id value must be an integer.")
            if not name:
                raise ValidationError("Every option must have a name.")
            if not display:
                raise ValidationError("Every option must have a display boolean.")
            if type(display) is not bool:
                raise ValidationError("Display value must be a boolean.")

            if suboption:
                suboption_type = suboption.get("type")

                if suboption_type == "dropdown":
                    if not suboption.get("options"):
                        raise ValidationError(
                            "Dropdown suboptions require an options object, please see the example above."
                        )
                elif suboption_type == "text":
                    if not suboption.get("label"):
                        raise ValidationError(
                            "Text input suboptions require a label key, please see the example above."
                        )
                else:
                    raise ValidationError("Invalid suboption type, available types are dropdown and text")

        return data
