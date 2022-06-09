from django.test import TestCase

from eventkit_cloud.jobs.forms import RegionalPolicyForm


class TestRegionalPolicyForm(TestCase):
    def test_policy_no_title(self):
        form = RegionalPolicyForm(data={"policies": [{"description": "description"}]})

        self.assertEqual(form.errors["policies"], ["Every policy must have a title."])

    def test_policy_no_description(self):
        form = RegionalPolicyForm(data={"policies": [{"title": "title"}]})

        self.assertEqual(form.errors["policies"], ["Every policy must have a description."])

    def test_justification_options_missing_id(self):
        form = RegionalPolicyForm(data={"justification_options": [{"name": "name", "display": True}]})

        self.assertEqual(form.errors["justification_options"], ["Every option must have an id."])

    def test_justification_options_invalid_id(self):
        form = RegionalPolicyForm(data={"justification_options": [{"id": "id", "name": "name", "display": True}]})

        self.assertEqual(form.errors["justification_options"], ["id value must be an integer."])

    def test_justification_options_missing_name(self):
        form = RegionalPolicyForm(data={"justification_options": [{"id": 1, "display": True}]})

        self.assertEqual(form.errors["justification_options"], ["Every option must have a name."])

    def test_justification_options_invalid_name(self):
        form = RegionalPolicyForm(data={"justification_options": [{"id": 1, "name": 1, "display": True}]})

        self.assertEqual(form.errors["justification_options"], ["name value must be a string."])

    def test_justification_options_missing_display(self):
        form = RegionalPolicyForm(data={"justification_options": [{"id": 1, "name": "name"}]})

        self.assertEqual(
            form.errors["justification_options"],
            ["Every option must have a display boolean."],
        )

    def test_justification_options_invalid_display(self):
        form = RegionalPolicyForm(data={"justification_options": [{"id": 1, "name": "name", "display": "display"}]})

        self.assertEqual(form.errors["justification_options"], ["Display value must be a boolean."])

    def test_justification_options_suboption_invalid_type(self):
        form = RegionalPolicyForm(
            data={
                "justification_options": [
                    {
                        "id": 1,
                        "name": "name",
                        "display": False,
                        "suboption": {"type": "invalid"},
                    }
                ]
            }
        )

        self.assertEqual(
            form.errors["justification_options"],
            ["Invalid suboption type, available types are dropdown and text."],
        )

    def test_justification_options_suboption_missing_options(self):
        form = RegionalPolicyForm(
            data={
                "justification_options": [
                    {
                        "id": 1,
                        "name": "name",
                        "display": False,
                        "suboption": {"type": "dropdown"},
                    }
                ]
            }
        )

        self.assertEqual(
            form.errors["justification_options"],
            ["Dropdown suboptions require an options object, please see the example above."],
        )

    def test_justification_options_suboption_missing_label(self):
        form = RegionalPolicyForm(
            data={
                "justification_options": [
                    {
                        "id": 1,
                        "name": "name",
                        "display": False,
                        "suboption": {"type": "text"},
                    }
                ]
            }
        )

        self.assertEqual(
            form.errors["justification_options"],
            ["Text input suboptions require a label key, please see the example above."],
        )
