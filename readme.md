Eventkit-Cloud
==============
[![Build Status](https://travis-ci.org/terranodo/eventkit-cloud.svg?branch=master)](https://travis-ci.org/terranodo/eventkit-cloud) [![Coverage Status](https://coveralls.io/repos/github/terranodo/eventkit-cloud/badge.svg?branch=master)](https://coveralls.io/github/terranodo/eventkit-cloud?branch=master)

Eventkit-cloud is based on the [HOT OSM Export Tool 2](https://github.com/hotosm/osm-export-tool2).  It allows the user to select data from different sources to export into a variety of formats.
  
## Getting Started
Eventkit-cloud requires [Docker](https://docs.docker.com/engine/installation/) or [Vagrant](https://www.vagrantup.com/). 

A setup guide for running docker in vagrant can be found in the [windows setup guide](windows.md).

### Installation 
Note: the RabbitMQ configuration provided here is the Official Docker version and is Copyright (c) 2014-2015 Docker, Inc. 

After installing docker open an elevated shell/command prompt and enter:
<pre>git clone https://repo_server/repo_org/eventkit-cloud.git
cd eventkit-cloud
docker-compose run --rm eventkit python manage.py runinitial setup
docker-compose up</pre>
In a different elevated shell/command prompt add the cloud.eventkit.dev to the hosts file:
On linux:
<code> echo "127.0.0.1  cloud.eventkit.dev" > /etc/hosts </code>
On windows:
<code> echo "127.0.0.1  cloud.eventkit.dev" > "C:\Windows\System32\drivers\etc\hosts"</code>
Then open a browser and navigate to http://cloud.eventkit.dev

### Settings
The following are a few of the relevant environment variables that can be used to adjust how eventkit_cloud is configured.

#### Site Name

You can set the hostname that the web server will respond and properly authenticate using `SITE_NAME`.

*Please make sure you have SITE_NAME environment variable set to `cloud.eventkit.dev` 
in your shell or when you invoke `docker-compose up`.  If you are experiencing 302s or 403s when you attempt
login this is likely the culprit*

```
SITE_NAME='cloud.eventkit.dev'
```

#### S3 Storage
If you want your export files to be stored on S3 rather than locally add:
<pre>USE_S3=True
AWS_BUCKET_NAME='my-bucket'
AWS_ACCESS_KEY='my-access-key'
AWS_SECRET_KEY='my-secret-key'</pre>

#### Database
To use your own database connection string add:
<pre>DATABASE_URL='postgis://user:password@site:5432/database_name'</pre>

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

## Export Directories
If you need to change where export files are staged or downloaded you can add:
<pre>EXPORT_STAGING_ROOT='/path/to/staging/dir/'
EXPORT_DOWNLOAD_ROOT='/path/to/download/dir/'</pre>


## Building the bundle
<pre>docker-compose run --rm webpack npm run build</pre>
