

import os
import sys

from django.core.wsgi import get_wsgi_application

proj_path = "/var/lib/eventkit"
sys.path.append(proj_path)
os.chdir(proj_path)

from whitenoise.django import DjangoWhiteNoise

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
application = get_wsgi_application()
application = DjangoWhiteNoise(application)

from eventkit_cloud.tasks.scripts.debug import run_chain

print("Submitting Celery Chain...")
run_chain()
print("Done.")
