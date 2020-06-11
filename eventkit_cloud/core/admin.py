import logging

from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth.models import User
from django.contrib.sites.models import Site
from django import forms

from eventkit_cloud.core.models import GroupPermission, AttributeClass, validate_filter

logger = logging.getLogger(__name__)


# http://djangoweekly.com/blog/post/viewbrowse-all-django-admin-edits-recent-actions-listing
class LogEntryAdmin(admin.ModelAdmin):
    readonly_fields = (
        "content_type",
        "user",
        "action_time",
        "object_id",
        "object_repr",
        "action_flag",
        "change_message",
    )

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request, obj=None):
        return False

    def get_action(self, request):
        actions = super(LogEntryAdmin, self).get_actions(request)
        actions.pop("delete_selected", None)
        return actions


class AttributeClassForm(forms.ModelForm):
    class Meta:
        model = AttributeClass
        fields = ["name", "slug", "filter", "exclude", "complex"]

    def clean(self):
        cleaned_data = super().clean()
        filter = cleaned_data.get("filter")
        exclude = cleaned_data.get("exclude")
        complex = cleaned_data.get("complex")
        if (filter or exclude) and (complex):
            raise forms.ValidationError("Cannot use both filter/exclude and complex.")
        if not any([filter, exclude, complex]):
            raise forms.ValidationError("Filter/exclude or complex must have a valid value.")

    def clean_filter(self):
        filter = self.cleaned_data.get("filter")
        if filter:
            try:
                User.objects.filter(**filter)
            except Exception as e:
                raise forms.ValidationError(str(e))
        return filter

    def clean_exclude(self):
        exclude = self.cleaned_data.get("exclude")
        if exclude:
            try:
                User.objects.exclude(**exclude)
            except Exception as e:
                raise forms.ValidationError(str(e))
        return exclude

    def clean_complex(self):
        complex_filter = self.cleaned_data.get("complex")
        if complex_filter:
            try:
                validate_filter(complex_filter)
            except Exception as e:
                raise forms.ValidationError(str(e))
        return complex_filter


class AttributeClassAdmin(admin.ModelAdmin):
    """
    Admin form for editing export providers in the admin interface.
    """

    form = AttributeClassForm
    list_display = ("name", "slug")

    fieldsets = (
        (
            None,
            {
                "fields": ["name", "slug"],
                "description": "An attribute class is a filter that can be added to one or more DataProviders. "
                "The filter matches user attributes and if the user meets the criteria they will be "
                "added to that class and be allowed to download,or create datasets for those "
                "DataProviders. <br><br> There are two ways to create a filter the filter and exlude "
                "fields, or the complex filter field.<br><br> To check to see if the filter properly "
                "adds a certain user to an attribute class check the user page /admin/auth/user/.",
            },
        ),
        (
            "Filters",
            {
                "fields": ["filter", "exclude", "complex"],
                "description": "Filter and Exclude each take a dict and that value gets passed directly to the django "
                "filter and exclude methods, for the Users. "
                "https://docs.djangoproject.com/en/3.0/topics/db/queries/#retrieving-specific-objects-with-filters"
                "<br><br> For example if you wanted to only allow the users test1 and test2 access you can set:<br> "
                'Filter: {"username__i": ["test1","test2"]}<br><br> '
                "Conversely if everyone but those users were allowed access then you can exclude them:<br> "
                'Exclude: {"username__in": ["test1","test2"]}<br><br> '
                "Filter and exclude can be used together.  "
                "If wishing to filter on the users oauth attributes then use:<br> "
                'Filter: {"oauth__user_info__color": "blue"}<br><br> '
                "If needing more complicated filtering a boolean can be formed using thruples "
                "[left, center, right], is the lookup value.  "
                "Complex lookups can only be done using the Oauth pofile (i.e. user_info). "
                'Example:<br> [["blue","==","color"], "OR" ["red","==","color"]]<br>',
            },
        ),
    )


admin.site.unregister(Site)
admin.site.register(LogEntry, LogEntryAdmin)
admin.site.register(GroupPermission)
admin.site.register(AttributeClass, AttributeClassAdmin)
