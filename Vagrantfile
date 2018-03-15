# -*- mode: ruby -*-
# vi: set ft=ruby :
# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!

# Check required plugins
GLOBAL_REQUIRED_PLUGINS = %w(vagrant-hostsupdater)
exit unless GLOBAL_REQUIRED_PLUGINS.all? do |plugin|
  Vagrant.has_plugin?(plugin) || (
  puts "The #{plugin} plugin is required. Please install it with:"
  puts "$ vagrant plugin install #{plugin}"
  false
  )
end
    
VAGRANTFILE_API_VERSION = "2"
Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

    config.vm.hostname = "cloud.eventkit.test"
    config.vm.network :private_network, ip: "192.168.99.130"

    # Check required plugins
    DOCKER_REQUIRED_PLUGINS = %w(vagrant-reload)
    exit unless DOCKER_REQUIRED_PLUGINS.all? do |plugin|
      Vagrant.has_plugin?(plugin) || (
        puts "The #{plugin} plugin is required. Please install it with:"
        puts "$ vagrant plugin install #{plugin}"
        false
        )
    end

    config.vm.box = "ubuntu/trusty64"

    ## create a private network visible only to the host machine
    config.vm.provision :shell, path: "scripts/setup_dependencies.sh"
    config.vm.provision :reload
    config.vm.provision :shell, path: "scripts/install_docker.sh"

    config.vm.provider "virtualbox" do |vb|

       # Customize the amount of memory on the VM:
       vb.memory = "8192"
    end

end