Eventkit-Cloud
==============
[![Build Status](https://travis-ci.org/venicegeo/eventkit-cloud.svg?branch=master)](https://travis-ci.org/venicegeo/eventkit-cloud) [![Coverage Status](https://coveralls.io/repos/github/venicegeo/eventkit-cloud/badge.svg?branch=master)](https://coveralls.io/github/venicegeo/eventkit-cloud?branch=master)

Eventkit-cloud is based on the [HOT OSM Export Tool 2](https://github.com/hotosm/osm-export-tool2).  It allows the user to select data from different sources to export into a variety of formats.
  
## Getting Started
Eventkit-cloud requires [Docker](https://docs.docker.com/engine/installation/) or [Vagrant](https://www.vagrantup.com/). 

A setup guide for running docker in vagrant can be found in the [windows setup guide](windows.md).

### Installation 
_Note: the RabbitMQ configuration provided here is the Official Docker version and is Copyright (c) 2014-2015 Docker, Inc._

There are several options that may be set, however prior to using the EventKit docker setup, two variables must be set
in the environment running docker, `SITE_NAME` and `SITE_IP`.

Typically `SITE_NAME` is set to 'cloud.eventkit.test' and `SITE_IP` is '127.0.0.1'.  If needing to run the integration tests,
then `SITE_IP` must be set to a different IP available on the system, typically the local ip `192.168.X.X` or `10.0.X.X`.
This is usually done by using `export SITE_NAME=cloud.eventkit.test` on mac/linux or `setx SITE_NAME cloud.eventkit.test`. 
Usually docker-compose will need to be run as sudo.  In which case you want to make sure that the environment variables are made available as sudo won't always use the shell environment.



_Note: if running the docker setup with an IP set other than 127.0.0.1, then the application will be made available to other computer that can access the host machine at the `SITE_IP` address._

After installing docker open an elevated shell/command prompt and enter:
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
The following are a few of the relevant environment variables that can be used to adjust how eventkit_cloud is configured.

#### S3 Storage
If you want your export files to be stored on S3 rather than locally add:
<pre>USE_S3=True
AWS_BUCKET_NAME='my-bucket'
AWS_ACCESS_KEY='my-access-key'
AWS_SECRET_KEY='my-secret-key'</pre>

#### Database
To use your own database connection string add:
<pre>DATABASE_URL='postgis://user:password@site:5432/database_name'</pre>

To reset the database:
<pre>docker volume rm eventkitcloud_postgis_database</pre>
<pre>docker-compose run --rm eventkit python manage.py runinitial setup</pre>

#### Broker URL
To specify which RabbitMQ instance to use add:
<pre>BROKER_URL='amqp://guest:guest@rabbitmq:5672/'</pre>

#### Task error email
To configure the email address that will send out any error messages add:
<pre>EMAIL_HOST_USER='email@email.com'
EMAIL_HOST_PASSWORD='email-password'</pre>

#### Overpass API
To use your own instance of an Overpass API add:
<pre>OVERPASS_API_URL = 'my-overpass-site.com/api/interpreter'</pre>

If an Overpass API endpoint requires a client certificate, you can provide it as an environment variable in PEM format:
```
<provider slug>_CERT = '-----BEGIN CERTIFICATE-----
[certificate contents]
-----END CERTIFICATE-----
-----BEGIN PRIVATE KEY-----
[private key contents]
-----END PRIVATE KEY-----'
```


#### Geocoder
By default EventKit will use geonames.org. However it also supports pelias. If wishing to change the geocoder add:
<pre>GEOCODING_API_URL = 'http://my-pelias.com/api/v1'</pre>
<pre>GEOCODING_API_TYPE = 'pelias'</pre>

#### Basemap URL
To set the application basemap add:
<pre>BASEMAP_URL=http://my-tile-service.com/{z}/{x}/{y}.png</pre>

### Tests
To run tests:
<pre>docker-compose run --rm -e COVERAGE=True eventkit python manage.py test eventkit_cloud</pre>

## Export Directories
If you need to change where export files are staged or downloaded you can add:
<pre>EXPORT_STAGING_ROOT='/path/to/staging/dir/'
EXPORT_DOWNLOAD_ROOT='/path/to/download/dir/'</pre>


## Building the bundle
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
