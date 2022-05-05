from collections import deque

class LoggingContextHandler:
    def __init__(self):
        self.attributes = deque([{}])

    def add(self, **new_context_vars):
        old_context = self.attributes[0]
        new_context = {**old_context, **new_context_vars}
        self.attributes.appendleft(new_context)

    def get_context(self):
        return self.attributes[0]

    def remove(self):
        self.attributes.popleft()

    def __str__(self):
        return str(self.attributes)