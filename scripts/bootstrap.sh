#!/bin/bash


# set -e

export PATH=/usr/local/bin:$PATH:/usr/pgsql-9.5/bin
sudo echo "PATH=:$PATH" >> /etc/profile.d/path.sh

sudo groupadd eventkit
sudo useradd -g eventkit eventkit

sudo apt-get update
sudo apt-get -y install python-pip
sudo apt-get -y install vim
sudo apt-get -y install git

sudo pip install virtualenvwrapper
sudo echo 'export WORKON_HOME=/var/lib/eventkit/.virtualenvs' >> /etc/profile.d/path.sh
sudo echo 'export PROJECT_HOME=/var/lib/eventkit' >> /etc/profile.d/path.sh
sudo echo 'source /usr/local/bin/virtualenvwrapper.sh' >> /etc/profile.d/path.sh
source /etc/profile.d/path.sh
mkvirtualenv eventkit
sudo mkdir /var/lib/eventkit
sudo mkdir /var/lib/eventkit/oet2
workon eventkit

sudo apt-get -y install libpq-dev python-dev
sudo apt-get -y install postgis postgresql-contrib-9.5

sudo apt-get -y install gcc gcc-c++
sudo apt-get -y install zlib-devel

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
sudo apt-get -y install gdal-bin libgdal-dev libgdal20 libgeos-dev libspatialite-dev libspatialite7 libgeos-c1v5 libsqlite3-mod-spatialite

sudo apt-get -y install osmctools
sudo apt-get -y install spatialite-bin libspatialite7 libspatialite-dev
sudo apt-get -y install default-jre zip unzip

sudo service postgresql start
sudo update-rc.d postgresql enable

sudo grep -q '   peer' /etc/postgresql/9.5/main/pg_hba.conf && sudo sed -i "s/   peer/   trust/g" /etc/postgresql/9.3/main/pg_hba.conf
sudo grep -q '   ident' /etc/postgresql/9.5/main/pg_hba.conf && sudo sed -i "s/   ident/   trust/g" /etc/postgresql/9.3/main/pg_hba.conf
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

mkdir /var/lib/eventkit/tmp
cd /var/lib/eventkit/tmp
sudo git clone https://github.com/terranodo/osm-export-tool2.git
cd osm-export-tool2
sudo git checkout apps-refactor
cp -R * /var/lib/eventkit/oet2 /var/lib/eventkit/.virtualenvs/eventkit/lib/python2.7/site-packages/
cd /var/lib/eventkit/tmp
sudo git clone https://github.com/terranodo/eventkit-cloud.git
cd eventkit-cloud
#git checkout initialVagrant
#"cd /var/lib/eventkit/vagrant" is only while developing
#cd /var/lib/eventkit/vagrant
cp -R * /var/lib/eventkit
cd /var/lib/eventkit
sudo apt-get -y install libxml2-dev libxslt-dev
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
pip install -r requirements.txt
pip install -r requirements-dev.txt
rm -rf /var/lib/eventkit/tmp

sudo mkdir /var/lib/eventkit/OsmAndMapCreator
cd /var/lib/eventkit/OsmAndMapCreator
sudo wget http://download.osmand.net/latest-night-build/OsmAndMapCreator-main.zip
sudo unzip /var/lib/eventkit/OsmAndMapCreator/OsmAndMapCreator-main.zip
sudo rm -f OsmAndMapCreator-main.zip

sudo wget http://www.mkgmap.org.uk/download/mkgmap-r3693.zip
sudo unzip mkgmap-r3693.zip
sudo mv mkgmap-r3693 /var/lib/eventkit/
sudo wget http://www.mkgmap.org.uk/download/splitter-r437.zip
sudo unzip splitter-r437.zip
sudo mv splitter-r437 /var/lib/eventkit/
sudo echo '<?xml version="1.0" encoding="utf-8"?>
<!--
    Garmin IMG file creation config.
    @see utils/garmin.py
-->
<garmin obj="prog" src="cloud.eventkit.dev">
    <mkgmap>/var/lib/eventkit/mkgmap-r3693/mkgmap.jar</mkgmap>
    <splitter>/var/lib/eventkit/splitter-r437/splitter.jar</splitter>
    <xmx>1024m</xmx>
    <description>EventKit Export Garmin Map</description>
    <family-name>EventKit Exports</family-name>
    <family-id>2</family-id>
    <series-name>EventKit Exports</series-name>
</garmin>' > /var/lib/eventkit/.virtualenvs/eventkit/src/oet2/oet2/utils/conf/garmin_config.xml



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

sudo echo '[unix_http_server]
file=/var/run/supervisor.sock

[supervisord]
pidfile=/var/run/supervisor.pid
logfile=/var/log/supervisor.log
logfile_backups=1

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock

[group:oet2]
programs=oet2, celery-1, celery-2
priority=999

[program:oet2]
directory = /var/lib/eventkit
command = /var/lib/eventkit/.virtualenvs/eventkit/bin/gunicorn eventkit_cloud.wsgi:application
           --bind cloud.eventkit.dev:6080
           --worker-class eventlet
           --workers 2
           --threads 4
           --access-logfile /var/log/eventkit/oet2-access-log.txt
           --error-logfile /var/log/eventkit/oet2-error-log.txt
           --name eventkit
           --user eventkit
           --no-sendfile
user=eventkit
priority=1
autostart=true
autorestart=true
stdout_logfile=/var/log/eventkit/stdout.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
stderr_logfile=/var/log/eventkit/stderr.log
stderr_logfile_maxbytes=50MB
stderr_logfile_backups=5
stopsignal=INT

[program:celery-1]
directory = /var/lib/eventkit
command = /var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py celery worker --loglevel debug --logfile=/var/log/eventkit/celery.log
environment=DJANGO_SETTINGS_MODULE="eventkit_cloud.settings.dev"
user=eventkit
autostart=true
autorestart=true
stdout_logfile=/var/log/eventkit/stdout.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
stderr_logfile=/var/log/eventkit/stderr.log
stderr_logfile_maxbytes=50MB
stderr_logfile_backups=5
stopsignal=INT

[program:celery-2]
directory=/var/lib/eventkit
command=/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py celery beat --loglevel debug --logfile=/var/log/eventkit/celery-beat.log
environment=DJANGO_SETTINGS_MODULE="eventkit_cloud.settings.dev"
user=eventkit
autostart=true
autorestart=true
stdout_logfile=/var/log/eventkit/stdout.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=5
stderr_logfile=/var/log/eventkit/stderr.log
stderr_logfile_maxbytes=50MB
stderr_logfile_backups=5
stopsignal=INT' > /etc/supervisor/supervisord.conf

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


sudo echo '<VirtualHost *:80>
        ServerName cloud.eventkit.dev
        ServerAdmin webmaster@localhost
        ExtFilterDefine gzip mode=output cmd=/bin/gzip

        ScriptAlias /overpass-api/ /bin/cgi-bin/
        Alias /static/ /var/lib/eventkit/static/
        Alias /downloads/ /var/lib/eventkit/exports_download/

        <Directory "/bin/cgi-bin/">
                AllowOverride None
                Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
                Require all granted
        </Directory>

        <Directory "/var/lib/eventkit/static/">
                AllowOverride None
                Options -MultiViews +SymLinksIfOwnerMatch
                Require all granted
        </Directory>

        <Directory "/var/lib/eventkit/exports_download/">
                AllowOverride None
                Options -MultiViews +SymLinksIfOwnerMatch
                Require all granted
        </Directory>

        ErrorLog /var/log/eventkit/apache2-error.log

        LogLevel warn

        CustomLog /var/log/eventkit/apache2-access.log combined

        ProxyPreserveHost On
        ProxyPass /overpass-api !
        ProxyPass /downloads !
        ProxyPass /static !
        ProxyPass / http://cloud.eventkit.dev:6080/
        ProxyPassReverse / http://cloud.eventkit.dev:6080/

</VirtualHost>' > /etc/apache2/sites-available/eventkit.conf
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

sudo /var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
sudo /var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
#sed -i -e 's/start-stop-daemon --start --quiet/start-stop-daemon --start --chuid eventkit --quiet/g' /etc/init.d/supervisor
sudo service supervisor start
sudo update-rc.d supervisor enable
sudo chown -R eventkit:eventkit /var/log/eventkit

sudo service apache2 start
sudo update-rc.d apache2 enable



