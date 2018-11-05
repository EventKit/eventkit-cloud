grep /etc/profile.d/path.sh -e "export DEBUG=True" || echo "export DEBUG=True" >> /etc/profile.d/path.sh
grep /etc/profile.d/path.sh -e "export DEVELOPMENT=True" || echo "export DEVELOPMENT=True" >> /etc/profile.d/path.sh
grep /etc/profile.d/path.sh -e "export SITE_NAME=cloud.eventkit.test" || echo "export SITE_NAME=cloud.eventkit.test" >> /etc/profile.d/path.sh
grep /etc/profile.d/path.sh -e "export SITE_IP=192.168.99.130" || echo "export SITE_IP=192.168.99.130" >> /etc/profile.d/path.sh
source /etc/profile.d/path.sh
apt-get update
apt-get -y install docker-engine python-pip
pip install --upgrade pip
pip install docker-compose
service docker start
