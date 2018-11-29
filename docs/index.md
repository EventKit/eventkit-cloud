
<img src="images/eventkit-logo-black.svg" alt="EventKit Logo" width="80%" style="margin-top:0; margin-bottom:0;" />

Eventkit-Cloud
==============

Eventkit-cloud is based on the [HOT OSM Export Tool](https://github.com/hotosm/osm-export-tool).  It allows the user to select data from different sources to export into a variety of formats.
  
## Getting Started
Eventkit-cloud requires [Docker](https://docs.docker.com/engine/installation/). 

### Installation 
_Note: the RabbitMQ configuration provided here is the Official Docker version and is Copyright (c) 2014-2015 Docker, Inc._

There are several options that may be set, however prior to using the EventKit docker setup, two variables must be set
in the environment running docker, `SITE_NAME` and `SITE_IP`.

Typically `SITE_NAME` is set to 'cloud.eventkit.test' and `SITE_IP` is '127.0.0.1'.  If needing to run the integration tests,
then `SITE_IP` must be set to a different IP available on the system, typically the local ip `192.168.X.X` or `10.0.X.X`.
This is usually done by using `export SITE_NAME=cloud.eventkit.test` on OSX/Linux or `setx SITE_NAME cloud.eventkit.test` on Windows. 
Usually docker-compose will need to be run as sudo.  In which case you want to make sure that the environment variables are made available as sudo won't always use the shell environment.

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
In a different elevated shell/command prompt add the cloud.eventkit.test to the hosts file:
On linux:
<code> echo "127.0.0.1  cloud.eventkit.test" > /etc/hosts </code>
On windows:
<code> echo "127.0.0.1  cloud.eventkit.test" > "C:\Windows\System32\drivers\etc\hosts"</code>
Then open a browser and navigate to http://cloud.eventkit.test

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
To run tests:
<pre>docker-compose run --rm -e COVERAGE=True eventkit python manage.py test eventkit_cloud</pre>
or
<pre>docker-compose run --rm eventkit pytest</pre>


#### Building the bundle
By default, the Eventkit webpack is configured for development, if you need to create bundle and vendor files for production run
<pre>docker-compose run --rm webpack npm run build</pre>


## For Developers
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
