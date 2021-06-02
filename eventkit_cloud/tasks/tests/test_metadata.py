import doctest
from eventkit_cloud.tasks import metadata


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(metadata))
    return tests
