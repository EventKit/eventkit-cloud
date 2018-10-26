import os
from distutils.core import setup, find_packages

def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

setup(
    name="eventkit",
    version="1.2.1",
    author="Joseph Svrcek",
    author_email="joseph.svrcek@rgi-corp.com",
    description="Eventkit Cloud",
    long_description=(read('readme.md')),
    # Full list of classifiers can be found at:
    # http://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        'Development Status :: 4 - Beta',
    ],
    license="BSD",
    keywords="eventkit osm-export-tool django",
    packages=['eventkit_cloud', find_packages()],
    package_data={'': ['*']},
    scripts=['manage.py']
)

