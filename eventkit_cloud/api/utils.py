from rest_framework.views import exception_handler
import logging

logger = logging.getLogger(__name__)


def eventkit_exception_handler(exc, context):
    """
    Example Response
    {
        "errors": [
            {
                "status": "422",
                "source": {"pointer": "/data/attributes/first-name"},
                "title": "Invalid Attribute",
                "detail": "First name must contain at least three characters."
            }
        ]
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)
    error = response.data
    error_response = {'status': response.status_code,
                      'title': error.get('title') or stringify(error.get('id')),
                      'detail': error.get('detail') or stringify(error.get('message'))}
    if not error_response.get('title'):
        error_response['title'] = "Improperly formatted JSON"
        error_response['detail'] = str(error)
    response.data = {'errors':[error_response]}

    return response


def stringify(item):
    """
    Take an array and makes it a string (or just returns string).
    :param item:
    :return:
    """
    if hasattr(item, '__iter__') and len(item) > 1:
        logger.error("Exceptions should have a title and description per message not multiple.")
        logger.error("Exception: {0}".format(str(item)))
    if isinstance(item, dict):
        return "{0}: {1}".format(item.iteritems().next())
    elif isinstance(item, list):
        return "{0}".format(item[0])
    elif isinstance(item, str):
        return item
    elif item is None:
        return ""
    else:
        raise Exception("Stringify doesn't support items of type {0}".format(type(item)))
