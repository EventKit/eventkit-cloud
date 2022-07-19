import sys
from importlib import reload

import django.urls.exceptions
from django.test import TestCase
from django.urls import ResolverMatch, resolve


class TestCoreUrls(TestCase):
    def reload(self, settings={}) -> None:
        # This is needed because url modules are normally loaded once, so to change them we need to reload them.
        with self.settings(**settings):
            url_modules = []
            for name, module in sys.modules.items():
                if "urls" in name.lower():
                    url_modules += [module]
            for module in url_modules:
                reload(module)

    def test_enable_admin(self):
        self.reload(settings={"ENABLE_ADMIN": True, "ENABLE_ADMIN_LOGIN": True, "ADMIN_ROOT": "admin"})
        self.assertIsInstance(resolve("/admin/"), ResolverMatch)

    def test_disable_admin(self):
        self.reload(settings={"ENABLE_ADMIN": False, "ENABLE_ADMIN_LOGIN": True, "ADMIN_ROOT": "admin"})
        with self.assertRaises(django.urls.exceptions.Resolver404):
            resolve("/admin/")

    def test_enable_admin_login(self):
        self.reload(settings={"ENABLE_ADMIN": True, "ENABLE_ADMIN_LOGIN": True, "ADMIN_ROOT": "admin"})
        resolver_match = resolve("/admin/login")
        self.assertIsInstance(resolver_match, ResolverMatch)
        self.assertEqual(resolver_match.view_name, "admin:django.contrib.admin.sites.catch_all_view")

    def test_disable_admin_login(self):
        self.reload(settings={"ENABLE_ADMIN": True, "ENABLE_ADMIN_LOGIN": False, "ADMIN_ROOT": "admin"})
        resolver_match = resolve("/admin/login")
        self.assertIsInstance(resolver_match, ResolverMatch)
        # Redirect to "login"
        self.assertEqual(resolver_match.view_name, "django.views.generic.base.RedirectView")

    def test_admin_root(self):
        self.reload(settings={"ENABLE_ADMIN": True, "ENABLE_ADMIN_LOGIN": True, "ADMIN_ROOT": "test_admin"})
        self.assertIsInstance(resolve("/test_admin/login"), ResolverMatch)
