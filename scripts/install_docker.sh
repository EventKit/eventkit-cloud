grep /etc/profile.d/path.sh -e "export DEBUG=True" || echo "export DEBUG=True" >> /etc/profile.d/path.sh
grep /etc/profile.d/path.sh -e "export DEVELOPMENT=True" || echo "export DEVELOPMENT=True" >> /etc/profile.d/path.sh
source /etc/profile.d/path.sh
apt-get update
apt-get -y install docker-engine python-pip
pip install docker-compose
service docker start
cd /vagrant
docker-compose up -d