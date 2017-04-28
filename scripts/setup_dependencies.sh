apt-get update
apt-get -y install apt-transport-https ca-certificates
apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
grep /etc/apt/sources.list.d/docker.list -e "deb https://apt.dockerproject.org/repo ubuntu-trusty main" || echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" >> /etc/apt/sources.list.d/docker.list
apt-get update
apt-get purge lxc-docker
apt-cache policy docker-engine
apt-get update
apt-get -y install linux-image-extra-$(uname -r) linux-image-extra-virtual
