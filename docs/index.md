# Eventkit-Cloud

![EventKit Logo](./images/eventkit-logo-black.svg)

---

Eventkit-cloud is based on the [HOT OSM Export Tool](https://github.com/hotosm/osm-export-tool).  It allows the user to select data from different sources to export into a variety of formats.

---

## Getting Started

### Minimum System Requirements

- Eventkit-cloud requires [Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).

- It's also required that you change some of the default Docker settings.  
  - You'll want to update your Docker resources settings to include at least 2 CPUs and a minimum of 8GB of RAM.
    - On Windows, in WSL, you will need to update your `.wslconfig` file. [Link to documentation](https://docs.microsoft.com/en-us/windows/wsl/wsl-config#example-wslconfig-file)
    - For Mac, follow one of the answers from here: [StackOverflow](https://stackoverflow.com/questions/32834082/how-to-increase-docker-machine-memory-mac)
    - In Linux, Docker can use all available memory already

### Installation

Prior to using the EventKit docker setup, two variables must be set in the environment running docker, `SITE_NAME` and `SITE_IP`.

Typically `SITE_NAME` is set to `host.docker.internal` and `SITE_IP` is `127.0.0.1`.

If needing to run the integration tests, then `SITE_IP` must be set to a different IP available on the system, typically the local ip `192.168.X.X` or `10.0.X.X`.

This is usually done by using

- `export SITE_NAME=host.docker.internal` on OSX/Linux
- or
- `setx SITE_NAME host.docker.internal` on Windows.

> You can also set these in your bashrc file or in the `.env` file in this project repo

You'll also need to open an elevated shell/command prompt add host.docker.internal to the hosts file:

- On Linux: `echo "127.0.0.1  host.docker.internal" >> /etc/hosts`
- On Windows: `echo "127.0.0.1  host.docker.internal" >> "C:\Windows\System32\drivers\etc\hosts"`

> ### Note: Ensure that your host file in Windows has proper line endings (`\r\n`) or you may corrupt the file

If you changed the `SITE_IP` to a local available IP address instead of `127.0.0.1`, you'll want to use that same IP in the hosts file.

After you have the above steps completed you can proceed on to either the Makefile based automated build or the manual build process outlined below.

## Quick Start

> A note for Windows WSL users, having the project be located on the WSL side will improve build and load times

A Makefile is included to make it easier to get started with a fresh installation.  In order to get started right away, simply run `make fresh` in the root project directory.  This will setup group permissions (for Linux and WSL hosts only), build your dependencies, setup the initial data, and bring your docker containers online.  There are additional Make commands inside the Makefile, and they're documented there as well.

After running `make fresh` you can hit the site directly at the URL you chose for the `SITE_NAME` which is generally [host.docker.internal](host.docker.internal).

For more developer setup, continue to the [Developers section](#for-developers)

To start using the application, continue to the [Next Steps](#next-steps)

---
---

## Manual Setup

If you'd like to setup the project manually, you can use the documentation below to do so.  It's recommended that you use the Make commands instead, especially if you're running on a Linux host environment.

### Building the dependencies

Before you can build the eventkit container you first need to build a local conda repo that will be used in the creation of the EventKit containers.

This will probably take about an hour or two depending on your system settings and internet speed.

After installing docker open an elevated shell/command prompt and enter:

```shell
cd conda
docker-compose run --rm conda
```

> Now grab a warm beverage; perhaps a nice technical manual to read through...

In the future it may be nice to host prebuilt artifacts but the ability to build these locally allows us to upgrade dependencies without needing to rely on third-party hosting.

After conda successfully builds you can now build and start the EventKit application.

```shell
git clone https://repo_server/repo_org/eventkit-cloud.git
cd eventkit-cloud
docker-compose run --rm eventkit python manage.py runinitial setup
docker-compose up
```

Then open a browser and navigate to [http://host.docker.internal](http://host.docker.internal)

Linux users have indicated issues with the docker setup.  That is because it mounts directories in the containers, and on linux the container user and host user permissions are mapped. To solve this problem run:

```shell
groupadd -g 880 eventkit
useradd -u 8800 -g 880 eventkit
```

Then give ownership of the repo to that user and group, _being careful_ not to change permissions in a way that your current user (i.e. `whoami`) will no longer have access to the files.

Ownership is typically given with : `chown eventkit:eventkit -R <repo_path>`

### Settings

EventKit can be configured to support many different environments, visit the [settings readme](./settings.md) in the documentation for options.

### Data Sources

EventKit can be configured to support many different data sources within the application, visit the [sources readme](./sources.md) in the documentation for options.

### Tests

To run all the unit tests:

```shell
make test
```

or

```shell
docker-compose run --rm -e COVERAGE=True eventkit python manage.py test -v 3 eventkit_cloud
docker-compose run --rm webpack npm test
```

#### Building the bundle

By default, the Eventkit webpack is configured for development, if you need to create bundle and vendor files for production run: `docker-compose run --rm webpack npm run build`

#### Deploying

The built EventKit containers can be pushed to a platform like Kubernetes or some other container service.
Additionally it can be deployed on [Pivotal Cloud Foundry](https://github.com/EventKit/eventkit-cloud/blob/master/docs/pcf.md).

For more developer setup, continue to the [Developers section](#for-developers)

To start using the application, continue to the [Next Steps](#next-steps)

---

## For Developers

### Debugging

When debugging file conversion issues it can be helpful to use the environment settings `KEEP_STAGE=True`,
which will not delete the staged files after the run completes/fails.

Additionally there is some configuration to run all services except for celery by running: `docker-compose -f docker-compose.yml -f docker-compose.debug.yml up -d`

Then in your IDE you can configure your debugger to run celery in `DEBUG` mode with the following environment variables:

```env
BROKER_API_URL=http://guest:guest@localhost:15672/api/
BROKER_URL=amqp://guest:guest@localhost:5672/
CELERY_SCALE_BY_RUN=True
DEBUG_CELERY=True
EXPORT_DOWNLOAD_ROOT=<path to downloads>
EXPORT_STAGING_ROOT=<path to stage>
GDAL_DATA=<path to virtual env>/share/gdal
KEEP_STAGE=True
MEMCACHED=localhost:11211
PROJ_LIB=<path to virtual env>/share/proj
PYTHONUNBUFFERED=1
SECRET_KEY=<same secret as your dev env>
SITE_IP=127.0.0.1
SITE_NAME=host.docker.internal
SSL_VERIFICATION=/home/user/eventkit-cloud/conda/cacert.pem
```

#### Using ESLint

To use ESLint while working on the EventKit front-end, first make sure you have Node.js and NPM installed in your local dev environment.
You can find the instructions for installing them here [installing Node](https://docs.npmjs.com/getting-started/installing-node).
Then in the EventKit root directory (on your local machine, not in the docker container) simply run: `npm run-script install-linter`

Next you will need to follow instructions to add ESLint into your IDE of choice.
For most IDEs that should mean finding and installing (if not already installed) the relevant ESLint plugin, and if needed, adjusting the settings to point to your specific package install location.

For VSCode try the following:
[VsCode Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

For WebStorm try the following:
[WebStorm Eslint](https://www.jetbrains.com/help/webstorm/eslint.html)

Finally, if you would like to adjust any of the linting rules edit the .eslintrc.json file in the EventKit root directory.

### Using Flake8

We use flake8 as a linter in our build pipeline.  Prior to submitting pull request, please make sure you've run flake8 on your code using: `make flake8`

### Using Black

Black is an auto formatting tool for Python that will allow you to handle most of the flake8 / pep8 formatting without having to do it manually.  There are two Make commands for Black, the first one will check and see if any formatting needs to be done.  Always run that before running the auto formatting tool, and make sure the changes it reports make sense to you.

```shell
make black
make black-format
```

### Run checks concurrently

A helper script is available to run all of the linters and tests concurrently which can help speed up the time to quickly check what needs to be fixed.

```shell
python scripts/check_code.py
```
or 
```shell
make check
```

Be sure check out the other documentation:

- [Sources](./sources.md)
- [Settings breakdown](./settings.md)
- [Pivotal Cloud Foundry](./pcf.md)

Other useful links for development

- [Main Dashboard](http://host.docker.internal/dashboard)
- [Admin page](http://host.docker.internal/admin/)
- [API testing page](http://host.docker.internal/api/docs/)

---

## Next steps

### Initial prep

For the ease of keeping track on your personal files, make a directory at root called `adhoc` (This file and contents are already ignored by git)

#### Adding sources

More information, and a full breakdown, can be found in the [Sources readme](./sources.md)


