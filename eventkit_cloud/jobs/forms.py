import logging

from django.contrib.gis import forms
from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ValidationError
from django.forms.widgets import Textarea

from eventkit_cloud.jobs.models import Region

logger = logging.getLogger(__name__)


class RegionForm(forms.ModelForm):
    class Meta:
        model = Region
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super(RegionForm, self).__init__(*args, **kwargs)
        self.fields["bounding_box"].widget = Textarea()

        if "bounding_box" in self.initial:
            self.initial["bounding_box"] = GEOSGeometry(self.instance.bounding_box).geojson

        if self.instance.justification_options:
            self.previous_justification_option_ids = []
            for previous_justification_option in self.instance.justification_options["justification_options"]:
                previous_option_id = previous_justification_option.get("id")
                self.previous_justification_option_ids.append(previous_option_id)

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

        justification_option_ids = []

        for justification_option in justification_options:
            option_id = justification_option.get("id")
            justification_option_ids.append(option_id)
            name = justification_option.get("name")
            display = justification_option.get("display")
            suboption = justification_option.get("suboption")

            if not option_id:
                raise ValidationError("Every option must have an id.")
            if type(option_id) is not int:
                raise ValidationError("id value must be an integer.")
            if not name:
                raise ValidationError("Every option must have a name.")
            if type(name) is not str:
                raise ValidationError("name value must be a string.")
            if "display" not in justification_option:
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
                    raise ValidationError("Invalid suboption type, available types are dropdown and text.")

        # Ensure that an option is never removed.
        for previous_justification_option_id in self.previous_justification_option_ids:
            if previous_justification_option_id not in justification_option_ids:
                raise ValidationError(
                    f"Missing justification option id {previous_justification_option_id}."
                    "Please do not remove options, set display to false instead."
                )

        return data
