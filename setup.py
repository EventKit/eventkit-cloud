import os
from distutils.core import setup

def read(*rnames):
    return open(os.path.join(os.path.dirname(__file__), *rnames)).read()

setup(
    name="eventkit",
    version="0.1",
    author="",
    author_email="",
    description="Eventkit Cloud",
    long_description=(read('README.md')),
    # Full list of classifiers can be found at:
    # http://pypi.python.org/pypi?%3Aaction=list_classifiers
    classifiers=[
        'Development Status :: 1 - Planning',
    ],
    license="BSD",
    keywords="osm-export-tool2 django eventkit",
    packages=['oet2',],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
    ]
)
