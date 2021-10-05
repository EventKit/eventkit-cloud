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
