from __future__ import absolute_import

import logging
from django.template.response import TemplateResponse

logger = logging.getLogger(__name__)


class IERedirect:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_template_response(self, request, response):
        # if browser is IE, return the no-ie message template
        agent = request.META.get('HTTP_USER_AGENT', '')
        if 'MSIE' in agent:
            return TemplateResponse(request, 'ui/ie_index.html')
        return response
