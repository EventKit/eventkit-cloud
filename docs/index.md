
<img src="images/eventkit-logo-black.svg" alt="EventKit Logo" width="80%" style="margin-top:0; margin-bottom:0;" />

Eventkit-Cloud
==============

Eventkit-cloud is based on the [HOT OSM Export Tool](https://github.com/hotosm/osm-export-tool).  It allows the user to select data from different sources to export into a variety of formats.
## Getting Started
### Minimum System Requirements
Eventkit-cloud requires [Docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/).

It's also required that you change some of the default Docker settings.  You'll want to update your Docker resources settings to include at least 2 CPUs and a minimum of 8GB of RAM.

### Installation

Prior to using the EventKit docker setup, two variables must be set in the environment running docker, `SITE_NAME` and `SITE_IP`.

Typically `SITE_NAME` is set to 'host.docker.internal' and `SITE_IP` is '127.0.0.1'.  If needing to run the integration tests,
then `SITE_IP` must be set to a different IP available on the system, typically the local ip `192.168.X.X` or `10.0.X.X`.
This is usually done by using `export SITE_NAME=host.docker.internal` on OSX/Linux or `setx SITE_NAME host.docker.internal` on Windows.

You'll also need to open an elevated shell/command prompt add host.docker.internal to the hosts file:

On Linux: <code>echo "127.0.0.1  host.docker.internal" > /etc/hosts</code>

On Windows: <code>echo "127.0.0.1  host.docker.internal" > "C:\Windows\System32\drivers\etc\hosts"</code>

If you changed the `SITE_IP` to a local available IP address instead of `127.0.0.1`, you'll want to use that same IP in the hosts file.

After you have the above steps completed you can proceed on to either the Makefile based automated build or the manual build process outlined below.

## Quick Start

A Makefile is included to make it easier to get started with a fresh installation.  In order to get started right away, simply run `make fresh` in the root project directory.  This will setup group permissions (for Linux hosts only), build your dependencies, setup the initial data, and bring your docker containers online.  There are additional Make commands inside the Makefile, and they're documented there as well.

After running `make fresh` you can hit the site directly at the URL you chose for the `SITE_NAME` which is generally `host.docker.internal`.

## Manual Setup

If you'd like to setup the project manually, you can use the documentation below to do so.  It's recommended that you use the Make commands instead, especially if you're running on a Linux host environment.

#### Building the dependencies
Before you can build the eventkit container you first need to build a local conda repo that will be used in the creation of the EventKit containers.

This will probably take about an hour or two depending on your system settings and internet speed.

After installing docker open an elevated shell/command prompt and enter:
<pre>
cd conda
docker-compose run --rm conda  # now grab a warm beverage perhaps a nice technical manual to read through...
cd ..
</pre>

In the future it may be nice to host prebuilt artifacts but the ability to build these locally allows us to upgrade dependencies without needing to rely on third-party hosting.

After conda successfully builds you can now build and start the EventKit application.

_Note: if running the docker setup with an IP set other than 127.0.0.1, then the application will be made available to other computer that can access the host machine at the `SITE_IP` address._

<pre>git clone https://repo_server/repo_org/eventkit-cloud.git
cd eventkit-cloud
docker-compose run --rm eventkit python manage.py runinitial setup
docker-compose up</pre>
Then open a browser and navigate to http://host.docker.internal

Linux users have indicated issues with the docker setup.  That is because it mounts directories in the containers, and on linux the container user and host user permissions are mapped. To solve this problem run:
<pre>groupadd -g 880 eventkit
useradd -u 8800 -g 880 eventkit</pre>
Then give ownership of the repo to that user and group, _being careful_ not to change permissions in a way that your current user (i.e. `whoami`) will no longer have access to the files.
Ownership is typically given with
<code> chown eventkit:eventkit -R <repo_path></code>

### Settings

EventKit can be configured to support many different environments, visit the [settings readme](./settings.md) in the documentation for options.

### Data Sources

EventKit can be configured to support many different data sources within the application, visit the [sources readme](./sources.md) in the documentation for options.

### Tests
To run all the unit tests:
<pre>make test</pre>
or
<pre>
docker-compose run --rm -e COVERAGE=True eventkit python manage.py test -v 3 eventkit_cloud
docker-compose run --rm webpack npm test
</pre>


#### Building the bundle
By default, the Eventkit webpack is configured for development, if you need to create bundle and vendor files for production run
<pre>docker-compose run --rm webpack npm run build</pre>

#### Deploying
The built EventKit containers can be pushed to a platform like Kubernetes or some other container service.
Additionally it can be deployed on [Pivotal Cloud Foundry](https://github.com/EventKit/eventkit-cloud/blob/master/docs/pcf.md).

## For Developers

#### Debugging

When debugging file conversion issues it can be helpful to use the environment settings `KEEP_STAGE=True`, 
which will not delete the staged files after the run completes/fails.

#### Using ESLint
To use ESLint while working on the EventKit front-end, first make sure you have Node.js and NPM installed in your local dev environment.
You can find the instructions for installing them here https://docs.npmjs.com/getting-started/installing-node
Then in the EventKit root directory (on your local machine, not in the docker container) simply run:
<pre>npm run-script install-linter</pre>

Next you will need to follow instructions to add ESLint into your IDE of choice.
For most IDEs that should mean finding and installing (if not already installed) the relevant ESLint plugin, and if needed, adjusting the settings to point to your specific package install location.

For VSCode try the following:
https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint

For WebStorm try the following:
https://www.jetbrains.com/help/webstorm/eslint.html

Finally, if you would like to adjust any of the linting rules edit the .eslintrc.json file in the EventKit root directory.

### Using Flake8

We use flake8 as a linter in our build pipeline.  Prior to submitting pull request, please make sure you've run flake8 on your code using:

<pre>make flake8</pre>

### Using Black

Black is an auto formatting tool for Python that will allow you to handle most of the flake8 / pep8 formatting without having to do it manually.  There are two Make commands for Black, the first one will check and see if any formatting needs to be done.  Always run that before running the auto formatting tool, and make sure the changes it reports make sense to you.

<pre>
make black
make black-format
</pre>
