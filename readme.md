Eventkit-Cloud
==============

Eventkit-cloud is based on the [HOT OSM Export Tool 2](https://github.com/hotosm/osm-export-tool2).  It allows the user to select data from different sources to export into a variety of formats.
  
## Getting Started
Eventkit-cloud requires [Vagrant](https://www.vagrantup.com/), which itself requires [Virtualbox](https://www.virtualbox.org/wiki/Downloads) or [Docker](https://docs.docker.com/engine/installation/)

### Vagrant
After installing the dependencies open an elevated shell/command prompt and enter:
<pre>git clone http://github.com/terranodo/eventkit-cloud.git
cd eventkit-cloud
vagrant plugin install vagrant-hostsupdater
vagrant up</pre>
After the virtual machine finishes provisioning, open a browser and navigate to http://cloud.eventkit.dev

### Docker 
Note: the RabbitMQ configuration provided here is the Official Docker version and is Copyright (c) 2014-2015 Docker, Inc. 

After installing docker open an elevated shell/command prompt and enter:
<pre>git clone http://github.com/terranodo/eventkit-cloud.git
cd eventkit-cloud
wget https://partner-images.canonical.com/core/xenial/current/ubuntu-xenial-core-cloudimg-amd64-root.tar.gz
docker-compose up</pre>
In a different elevated shell/command prompt add the cloud.eventkit.dev to the hosts file:
On linux:
<code> echo "127.0.0.1  cloud.eventkit.dev" > /etc/hosts </code>
On windows:
<code> echo "127.0.0.1  cloud.eventkit.dev" > "C:\Windows\System32\drivers\etc\hosts"</code>
Then open a browser and navigate to http://cloud.eventkit.dev


