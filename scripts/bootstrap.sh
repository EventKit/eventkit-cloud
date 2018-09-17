#!/bin/bash

#MKGMAP_VERSION=r3694
#SPLITTER_VERSION=r437

export PATH=/usr/local/bin:$PATH:/usr/pgsql-9.5/bin
sudo echo "PATH=:$PATH" >> /etc/profile.d/path.sh

sudo groupadd eventkit
sudo useradd -g eventkit eventkit

sudo apt-get update
sudo apt-get -y install python-pip
sudo apt-get -y install vim
sudo apt-get -y install git

sudo pip install --upgrade pip
sudo pip install virtualenvwrapper
sudo echo 'export WORKON_HOME=/var/lib/.virtualenvs' >> /etc/profile.d/path.sh
sudo echo 'export PROJECT_HOME=/var/lib/eventkit' >> /etc/profile.d/path.sh
sudo echo 'export DEVELOPMENT=True' >> /etc/profile.d/path.sh
sudo echo 'source /usr/local/bin/virtualenvwrapper.sh' >> /etc/profile.d/path.sh
source /etc/profile.d/path.sh
mkvirtualenv eventkit
sudo mkdir /var/lib/eventkit
workon eventkit

sudo apt-get -y install libpq-dev python-dev
sudo apt-get -y install postgis postgresql-contrib-9.5

sudo apt-get -y install gcc g++

cd /var/lib/eventkit
sudo git clone https://gitlab.com/osm-c-tools/osmctools.git
cd osmctools/src
sudo gcc osmupdate.c -o ../osmupdate
sudo gcc osmfilter.c -O3 -o ../osmfilter
sudo gcc osmconvert.c -lz -O3 -o ../osmconvert
cd ..
sudo cp osmupdate osmfilter osmconvert /usr/local/bin
cd ..
sudo rm -fr osmctools
cd ~

sudo apt-get -y install software-properties-common
sudo add-apt-repository -y ppa:ubuntugis/ubuntugis-unstable
sudo apt-get update
sudo apt-get -y install gdal-bin libgdal-dev libgeos-dev libspatialite-dev libspatialite7 libgeos-c1v5 libsqlite3-mod-spatialite

sudo apt-get -y install osmctools
sudo apt-get -y install spatialite-bin libspatialite7 libspatialite-dev
sudo apt-get -y install zip unzip

sudo service postgresql start
sudo update-rc.d postgresql enable

sudo grep -q '   peer' /etc/postgresql/9.5/main/pg_hba.conf && sudo sed -i "s/   peer/   trust/g" /etc/postgresql/9.5/main/pg_hba.conf
sudo grep -q '   ident' /etc/postgresql/9.5/main/pg_hba.conf && sudo sed -i "s/   ident/   trust/g" /etc/postgresql/9.5/main/pg_hba.conf
sudo service postgresql restart

sudo -u postgres createdb 'eventkit_exports_dev'
sudo -u postgres psql -c "CREATE ROLE eventkit WITH PASSWORD 'eventkit_exports_dev';"
sudo -u postgres psql -d eventkit_exports_dev -c "ALTER ROLE eventkit SUPERUSER;"
sudo -u postgres psql -d eventkit_exports_dev -c "ALTER ROLE eventkit WITH LOGIN;"
sudo -u postgres psql -d eventkit_exports_dev -c "GRANT ALL PRIVILEGES ON DATABASE eventkit_exports_dev TO eventkit;"
sudo -u postgres psql -d eventkit_exports_dev -c "CREATE EXTENSION POSTGIS;"
sudo -u postgres psql -d eventkit_exports_dev -c "CREATE EXTENSION HSTORE;"
sudo -u postgres psql -d eventkit_exports_dev -c "CREATE SCHEMA exports AUTHORIZATION eventkit;"

# Python Celery (Async workers) relies on RabbitMQ.
sudo apt-get -y install rabbitmq-server
service rabbitmq-server start
sudo update-rc.d rabbitmq-server enable

cd /vagrant
#git checkout removeDJMP
#"cd /var/lib/eventkit/vagrant" is only while developing
#cd /var/lib/eventkit/vagrant
cp -R * /var/lib/eventkit
cd /var/lib/eventkit
sudo apt-get -y install libxml2-dev libxslt-dev
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install -r requirements.txt
pip install -r requirements-dev.txt

sudo mkdir /var/lib/eventkit/exports_stage
sudo mkdir /var/lib/eventkit/exports_download
sudo mkdir /var/lib/eventkit/db_dir
sudo chown eventkit:eventkit -R /var/lib/eventkit/

#export EXEC_DIR=/bin
#export DB_DIR=/var/lib/eventkit/db_dir
#
#sudo apt-get -y install expat-dev
#cd /var/lib/eventkit
#sudo wget http://dev.overpass-api.de/releases/osm-3s_v0.7.52.tar.gz
#sudo tar -zxvf osm-3s_v*.tar.gz
#cd osm-3s_v*
#./configure CXXFLAGS="-O3" --prefix=$EXEC_DIR
#sudo make install
#cd $DB_DIR
#sudo -u eventkit wget http://download.geofabrik.de/south-america/brazil-latest.osm.pbf
#sudo -u eventkit /usr/local/bin/osmconvert --out-osm brazil-latest.osm.pbf | /var/lib/eventkit/osm-3s*/bin/update_database --meta --db-dir=$DB_DIR --flush-size=1
#cd ~
#sudo git clone https://github.com/drolbr/Overpass-API.git
#sudo cp -pR Overpass-API/rules /var/lib/eventkit/db_dir/rules
#sudo rm -rf Overpass-API/

sudo mkdir /var/log/eventkit

sudo apt-get install supervisor apache2 -y

sudo cp /vagrant/config/supervisord.conf /etc/supervisor/supervisord.conf

#[program:overpass-api]
#directory = /bin
#command = /bin/sh -c "rm -f /dev/shm/osm3s*osm_base && rm -f /var/lib/eventkit/db_dir/osm3s*osm_base && /bin/bin/dispatcher --osm-base --meta --db-dir=/var/lib/eventkit/db_dir"
#user=eventkit
#priority=1
#autostart=true
#autorestart=true
#stdout_logfile=/var/log/eventkit/stdout.log
#stdout_logfile_maxbytes=50MB
#stdout_logfile_backups=5
#stderr_logfile=/var/log/eventkit/stderr.log
#stderr_logfile_maxbytes=50MB
#stderr_logfile_backups=5
#stopsignal=INT
#
#[program:overpass-areas]
#directory = /bin
#command = /bin/sh -c "rm -f /dev/shm/osm3s*areas && rm -f /var/lib/eventkit/db_dir/osm3s*areas && /bin/bin/dispatcher --areas --db-dir=/var/lib/eventkit/db_dir"
#user=eventkit
#autostart=true
#autorestart=true
#stdout_logfile=/var/log/eventkit/stdout.log
#stdout_logfile_maxbytes=50MB
#stdout_logfile_backups=5
#stderr_logfile=/var/log/eventkit/stderr.log
#stderr_logfile_maxbytes=50MB
#stderr_logfile_backups=5
#stopsignal=INT
#
#[program:overpass-rules]
#directory = /bin
#command = /bin/bin/rules_loop.sh /var/lib/eventkit/db_dir
#user=eventkit
#autostart=true
#autorestart=true
#stdout_logfile=/var/log/eventkit/stdout.log
#stdout_logfile_maxbytes=50MB
#stdout_logfile_backups=5
#stderr_logfile=/var/log/eventkit/stderr.log
#stderr_logfile_maxbytes=50MB
#stderr_logfile_backups=5
#stopsignal=INT


sudo cp /vagrant/config/eventkit.conf /etc/apache2/sites-available/eventkit.conf
a2enmod proxy
a2enmod proxy_http
a2enmod ext_filter
a2dissite 000-default.conf
a2ensite eventkit.conf
sudo service apache2 reload
usermod -g eventkit www-data
sudo chmod 755 /home
sudo chmod 755 /var/lib/eventkit
sudo chmod 755 /var/lib/eventkit
sudo chmod 775 /var/log/eventkit
sudo chown -R eventkit:eventkit /var/lib/eventkit /var/log/eventkit /var/log/supervisor.log


sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow proto tcp from 127.0.0.1 to 127.0.0.1 port 5672
sudo ufw allow proto tcp from 127.0.0.1 to 127.0.0.1 port 6080
sudo ufw allow proto tcp from 127.0.0.1 to 127.0.0.1 port 5432

sudo ufw --force enable

sudo echo "127.0.0.1 postgis rabbitmq" >> /etc/hosts

sudo /var/lib/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
sudo /var/lib/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py makemigrations
sudo /var/lib/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
sudo /var/lib/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/admin_user.json

sudo service supervisor restart
sudo update-rc.d supervisor enable
sudo chown -R eventkit:eventkit /var/log/eventkit

sudo service apache2 start
sudo update-rc.d apache2 enable

