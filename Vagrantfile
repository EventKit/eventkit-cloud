# -*- mode: ruby -*-
# vi: set ft=ruby :
# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "bento/ubuntu-16.04"
  config.vm.provision :shell, path: "scripts/bootstrap.sh"
  config.vm.hostname = "cloud.eventkit.dev"
  ## create a private network visible only to the host machine
  #config.vm.network :private_network, ip: "127.0.0.1"
  config.vm.network :private_network, ip: "192.168.99.130"
  # config.vm.synced_folder "./", "/var/lib/eventkit/vagrant"
  # config.vm.synced_folder "../osm-export-tool2/", "/var/lib/eventkit/.virtualenvs/eventkit/src/oet2"

  # Example of share an additional folder to the guest VM.
  config.vm.provider :virtualbox do |vb|
    vb.customize ["modifyvm", :id, "--memory", "8224", "--cpus", "4"]
  end
  
end
