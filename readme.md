Eventkit-Cloud
==============

Eventkit-cloud is based on the [HOT OSM Export Tool 2](https://github.com/hotosm/osm-export-tool2).  It allows the user to select data from different sources to export into a variety of formats.
  
## Getting Started
Eventkit-cloud requires [Vagrant](https://www.vagrantup.com/), which itself requires [Virtualbox](https://www.virtualbox.org/wiki/Downloads) or [Docker](https://docs.docker.com/engine/installation/)

### Vagrant
After installing the dependencies open an elevated shell/command prompt and enter:
<pre>git clone https://gitlab.devops.geointservices.io/eventkit/eventkit-cloud.git
cd eventkit-cloud
vagrant plugin install vagrant-hostsupdater
vagrant up nodocker</pre>
After the virtual machine finishes provisioning, open a browser and navigate to http://cloud.eventkit.dev

### Docker-in-Vagrant
If you are running on a windows machine but would like to develop using docker, a vagrant box can be built that will install docker and run it for you inside the vm.
To run Docker-in-Vagrant enter:
<pre>git clone https://gitlab.devops.geointservices.io/eventkit/eventkit-cloud.git
cd eventkit-cloud
vagrant plugin install vagrant-hostsupdater
vagrant up docker</pre>
Then ssh into the vm and run:
<pre>cd /vagrant
docker-compose build
docker-compose up</pre>

### Docker 
Note: the RabbitMQ configuration provided here is the Official Docker version and is Copyright (c) 2014-2015 Docker, Inc. 

After installing docker open an elevated shell/command prompt and enter:
<pre>git clone https://gitlab.devops.geointservices.io/eventkit/eventkit-cloud.git
cd eventkit-cloud
wget https://partner-images.canonical.com/core/xenial/current/ubuntu-xenial-core-cloudimg-amd64-root.tar.gz
docker-compose up</pre>
In a different elevated shell/command prompt add the cloud.eventkit.dev to the hosts file:
On linux:
<code> echo "127.0.0.1  cloud.eventkit.dev" > /etc/hosts </code>
On windows:
<code> echo "127.0.0.1  cloud.eventkit.dev" > "C:\Windows\System32\drivers\etc\hosts"</code>
Then open a browser and navigate to http://cloud.eventkit.dev

### Settings
The following environment variables can be used to adjust how eventkit_cloud is configured.

#### S3 Storage
If you want your export files to be stored on S3 rather than locally add:
<pre>USE_S3=True
AWS_BUCKET_NAME='<my-bucket>'
AWS_ACCESS_KEY='<my-access-key>'
AWS_SECRET_KEY='<my-secret-key>'</pre>

#### Database
To use your own database connection string add:
<pre>DATABASE_URL='postgis://<user>:<password>@<site>:5432/<database_name>'</pre>

#### Settings file
If you want to run eventkit_cloud using the dev.py settings file add:
<pre>DEVELOPMENT=True</pre>
If you want to run using the prod.py settings file add:
<pre>PRODUCTION=True</pre>

#### Task error email
To configure the email address that will send out any error messages add:
<pre>EMAIL_HOST_USER='<email>@<email>.com'
EMAIL_HOST_PASSWORD='<email-password>'</pre>

#### Overpass API
To use your own instance of an Overpass API add:
<pre>OVERPASS_API_URL = '<my-overpass-site.com>/api/interpreter'</pre>

## Export Directories
If you need to change where export files are staged or downloaded you can add:
<pre>EXPORT_STAGING_ROOT='/path/to/staging/dir/'
EXPORT_DOWNLOAD_ROOT='/path/to/download/dir/'</pre>
