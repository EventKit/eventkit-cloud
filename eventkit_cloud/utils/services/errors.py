from eventkit_cloud.utils.services.check_result import CheckResult, get_status_result


class ServiceError(Exception):
    """Base class for exceptions in this module."""

    pass


class UnsupportedFormatError(ServiceError):
    """Used to raise exceptions when a response doesn't match expected semantics or for failed version checks."""

    pass


class MissingLayerError(ServiceError):
    """Used if expected layer could not be found in the service."""

    def __init__(self, message):
        self.message = message


class ProviderCheckError(Exception):
    def __init__(self, check_result: CheckResult = None, *args, **kwargs):
        if check_result:
            self.status_result = get_status_result(check_result=check_result, **kwargs)
            self.message = self.status_result["message"]
        super().__init__(*args)
