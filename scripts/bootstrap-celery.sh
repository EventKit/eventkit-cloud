#!/bin/bash

sudo groupadd eventkit
sudo useradd -g eventkit eventkit

sudo apt-get update
sudo apt-get -y install python-pip vim git

sudo pip install --upgrade pip
sudo pip install virtualenvwrapper
sudo echo 'export WORKON_HOME=/var/lib/.virtualenvs' >> /etc/profile.d/path.sh
sudo echo 'export PROJECT_HOME=/var/lib/eventkit' >> /etc/profile.d/path.sh
sudo echo 'source /usr/local/bin/virtualenvwrapper.sh' >> /etc/profile.d/path.sh
source /etc/profile.d/path.sh
cd /var/lib
mkvirtualenv eventkit

workon eventkit

sudo apt-get -y install libpq-dev python-dev gcc g++

sudo apt-get -y install software-properties-common
sudo add-apt-repository -y ppa:ubuntugis/ubuntugis-unstable
sudo apt-get update
sudo apt-get -y install postgresql-9.3-postgis-2.2

sudo apt-get update
sudo apt-get install curl \
    linux-image-extra-$(uname -r) \
    linux-image-extra-virtual
sudo apt-get install apt-transport-https \
                       ca-certificates
curl -fsSL https://yum.dockerproject.org/gpg | sudo apt-key add -
sudo add-apt-repository \
       "deb https://apt.dockerproject.org/repo/ \
       ubuntu-$(lsb_release -cs) \
       main"
sudo apt-get update
sudo apt-get -y install docker-engine=1.12.3-0~xenial

sudo service postgresql start
sudo update-rc.d postgresql enable

sudo grep -q "#listen_addresses = 'localhost'" /etc/postgresql/9.3/main/postgresql.conf && sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/9.3/main/postgresql.conf
sudo grep -q '   peer' /etc/postgresql/9.3/main/pg_hba.conf && sudo sed -i "s/   peer/   trust/g" /etc/postgresql/9.3/main/pg_hba.conf
sudo grep -q '   ident' /etc/postgresql/9.3/main/pg_hba.conf && sudo sed -i "s/   ident/   trust/g" /etc/postgresql/9.3/main/pg_hba.conf
sudo echo "host    eventkit_exports     eventkit        all            md5" >> /etc/postgresql/9.3/main/pg_hba.conf

sudo service postgresql restart


sudo -u postgres createdb 'eventkit_exports'
sudo -u postgres psql -c "CREATE ROLE eventkit WITH PASSWORD 'eventkit_exports';"
sudo -u postgres psql -d eventkit_exports -c "ALTER ROLE eventkit SUPERUSER;"
sudo -u postgres psql -d eventkit_exports -c "ALTER ROLE eventkit WITH LOGIN;"
sudo -u postgres psql -d eventkit_exports -c "GRANT ALL PRIVILEGES ON DATABASE eventkit_exports TO eventkit;"
sudo -u postgres psql -d eventkit_exports -c "CREATE EXTENSION POSTGIS;"
sudo -u postgres psql -d eventkit_exports -c "CREATE EXTENSION HSTORE;"
sudo -u postgres psql -d eventkit_exports -c "CREATE SCHEMA exports AUTHORIZATION eventkit;"

mkdir /var/lib/eventkit/tmp
cd /var/lib/eventkit/tmp
sudo git clone https://github.com/venicegeo/eventkit-cloud.git
cd eventkit-cloud
sudo git fetch origin
cp -R * /var/lib/eventkit
cd /var/lib/eventkit
## EDIT DOCKER_COMPOSE IF NEEDED
sudo docker-compose up -d celery

sudo mkdir /var/lib/eventkit/exports_stage
sudo mkdir /var/lib/eventkit/exports_download
sudo mkdir /var/lib/eventkit/db_dir
sudo chown eventkit:eventkit -R /var/lib/eventkit/

sudo mkdir /var/log/eventkit

sudo apt-get install -y supervisor

sudo mv /var/lib/eventkit/tmp/eventkit-cloud/config/supervisord-celery.conf /etc/supervisor/supervisord.conf

sudo apt-get -y install rabbitmq-server
echo "export RABBITMQ_NODE_PORT=5672" >> /etc/profile.d/path.sh
echo "export RABBITMQ_DEFAULT_USER=rabbit_user" >> /etc/profile.d/path.sh
echo "export RABBITMQ_DEFAULT_PASSWORD=rabbit_password" >> /etc/profile.d/path.sh

sudo service rabbitmq-server restart
sudo update-rc.d rabbitmq-server enable

sudo ufw allow 22
sudo ufw allow 5432
sudo ufw allow 5672
sudo ufw --force enable

sudo service supervisor restart
sudo update-rc.d supervisor enable
sudo chown -R eventkit:eventkit /var/log/eventkit

rm -rf /var/lib/eventkit/tmp

sudo chmod 755 /home
sudo chmod 755 /var/lib/eventkit
sudo chmod 755 /var/lib/eventkit
sudo chmod 775 /var/log/eventkit

sudo chown -R eventkit:eventkit /var/lib/eventkit /var/log/eventkit /var/log/supervisor.log

# we need to kill all python processes to get rid of this annoying
# issue where supervisor boots up a worker before it gets a proper config
# The worker is harder to kill than weeds! It keeps trying to connect to
# a bogus rabbitmq URI and makes useless logs.
sudo killall python

# restart supervisord
sudo unlink /run/supervisor.sock
sudo /etc/init.d/supervisor restart
