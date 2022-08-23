# -*- coding: utf-8 -*-
from typing import Tuple

from django.utils.translation import gettext_lazy as _

# import SECRET_KEY into current namespace
from eventkit_cloud.settings.secret import SECRET_KEY  # NOQA
from eventkit_cloud.settings.utils import ABS_PATH

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = "UTC"

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = "en"

LANGUAGES = (("en", _("English")), ("de", _("German")), ("es", _("Spanish")), ("fr", _("French")))

LOCALE_PATHS = (ABS_PATH("locales"),)


# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = "/media/"

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = ABS_PATH("static")

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = "/static/"

# Additional locations of static files
STATICFILES_DIRS = (
    # Put strings here, like "/home/html/static" or "C:/www/django/static".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    # ABS_PATH('core', 'base_static')
)

# default middleware classes
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]

ROOT_URLCONF = "eventkit_cloud.urls"

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = "eventkit_cloud.wsgi.application"

INSTALLED_APPS: Tuple[str, ...] = (
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.postgres",
    "django.contrib.sites",
)


# enable cached storage
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.CachedStaticFilesStorage"

STATICFILES_FINDERS = (
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
)

AUTHENTICATION_BACKENDS: Tuple[str, ...] = ("django.contrib.auth.backends.ModelBackend",)

# Turn on Soft Deletes for Notifications
NOTIFICATIONS_SOFT_DELETE = True


# checks for boolean option
def is_true(option) -> bool:
    if isinstance(option, bool):
        return option
    if option and option.lower() in ["y", "yes", "t", "true", 1]:
        return True
    return False
