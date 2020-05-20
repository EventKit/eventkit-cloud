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
        fields = [
            "name",
            "slug",
            "filter",
            "exclude",
            "complex"
        ]

    def clean(self):
        cleaned_data = super().clean()
        filter = cleaned_data.get("filter")
        exclude = cleaned_data.get("exclude")
        complex = cleaned_data.get("complex")
        if ((filter or exclude) and (complex)):
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
    list_display = ('name', 'slug')


admin.site.unregister(Site)
admin.site.register(LogEntry, LogEntryAdmin)
admin.site.register(GroupPermission)
admin.site.register(AttributeClass, AttributeClassAdmin)
