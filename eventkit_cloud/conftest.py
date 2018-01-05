import pytest


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests():
    pass

@pytest.fixture(django_db_setup=True)
def use_database():
    pass

@pytest.fixture(django_db_use_migrations=True)
def use_migrations():
    pass