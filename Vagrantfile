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

  config.vm.define "eventkit", primary: true do |eventkit|
    eventkit.vm.box = "bento/ubuntu-16.04"
    eventkit.vm.provision :shell, path: "scripts/bootstrap.sh"
    eventkit.vm.hostname = "cloud.eventkit.dev"
    ## create a private network visible only to the host machine
    #config.vm.network :private_network, ip: "127.0.0.1"
    eventkit.vm.network :private_network, ip: "192.168.99.130"
    eventkit.vm.synced_folder "./eventkit_cloud", "/var/lib/eventkit/eventkit_cloud"

    # Example of share an additional folder to the guest VM.
    eventkit.vm.provider :virtualbox do |vb|
      vb.customize ["modifyvm", :id, "--memory", "4096", "--cpus", "4"]
    end
  end
  
  config.vm.define "docker", autostart: false do |docker|
    # Check required plugins
    DOCKER_REQUIRED_PLUGINS = %w(vagrant-reload)
    exit unless DOCKER_REQUIRED_PLUGINS.all? do |plugin|
      Vagrant.has_plugin?(plugin) || (
        puts "The #{plugin} plugin is required. Please install it with:"
        puts "$ vagrant plugin install #{plugin}"
        false
        )
    end

    docker.vm.box = "box-cutter/ubuntu1404-desktop"
    
    img_file = "ubuntu-xenial-core-cloudimg-amd64-root.tar.gz"
    unless File.exists?(img_file)
      require "open-uri"
      open(img_file, 'wb') do |file|
        file << open('https://partner-images.canonical.com/core/xenial/current/ubuntu-xenial-core-cloudimg-amd64-root.tar.gz').read
      end
    end
    docker.vm.hostname = "docker.eventkit.dev"
    ## create a private network visible only to the host machine
    #config.vm.network :private_network, ip: "127.0.0.1"
    docker.vm.network :private_network, ip: "192.168.99.140"
    docker.vm.provision :shell, path: "scripts/setup_dependencies.sh"
    docker.vm.provision :reload
    docker.vm.provision :shell, path: "scripts/install_docker.sh"

    docker.vm.provider "virtualbox" do |vb|
       # Display the VirtualBox GUI when booting the machine
       vb.gui = true
      
       # Customize the amount of memory on the VM:
       vb.memory = "8192"
    end
  end


end
