from django.apps import AppConfig


class EventKitUserRequests(AppConfig):
    name = "eventkit_cloud.user_requests"
    verbose_name = "Eventkit-Cloud User Requests"

    def ready(self):
        from eventkit_cloud.user_requests.signals import data_provider_post_save, size_request_post_save  # NOQA
