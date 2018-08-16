## Conda Configuration

### Introduction
Miniconda is a way to build and isolate dependencies.  These dependencies can be any type of binary or python dependendency.

The instructions for building the dependencies are in the recipes folder each dependency has a meta.yaml file which
contains information about the location of the source data, version information, and dependency information.  
There will also be a build script in the yaml or a separate build.sh file.  When `conda build <recipe folder name>`
is called conda will install all of the required dependencies and then attempt to build the named recipe. 

### Configuration
The conda directory contains a docker configuration, the conda recipes, and some build scripts. 

To build the conda dependencies simply run:
```
docker-compose run --rm conda
```
This builds a container with miniconda and loads the scripts and recipes.  By default it will try to build all of the
dependencies listed in recipes.txt.  

The reason the recipes are listed in recipes.txt is so that conda will build them in order, and each previous
recipe can be made available to the next one.

During the build process numerous dependencies (listed in the meta.yaml) files
will be installed in the virtual environment in the docker container.  At the end of the build script, ALL of the
dependencies and their related dependencies will be moved to a volume mapped folder called `repo`, this will appear on your local host.

Repo is a valid conda repository this means that the folder has the proper folder structure (i.e. linus-64 and noarch folders),
as well as repo metadata.  

### Build or rebuild a single recipe.

To build a single dependency the build script can be called with a recipe name.  When this is called, the build 
script will attempt to load the existing repository and use those built dependencies if they already exist.  Then 
it will try to build the single recipe.  If the build succeeds those new dependencies will be moved to the repo, 
and the repo metadata will be updated. 

For example:
```
docker-compose run --rm conda ./build.sh openjpeg
```
