#Getting started with Eventkit-Cloud on Windows

This guide will specifically help users who want to test the application on Windows.  Users with no development experience should be able to start the application.  Likewise a developer could use this setup as well, because any files edited in the host directory will be ran in the docker containers by stopping and restarting Docker.
## Initial Setup
1. Download and install Vagrant:
   -Download file`https://releases.hashicorp.com/vagrant/1.8.6/vagrant_1.8.6.msi`
   -Execute file.
   -Click *next*
   -Accept Terms click *next*.
   -Choose installation directory, click *next*.
   -Click *Install*.
   -Click *Finish*.
2. Restart computer.
3. Download and install Git:
   -Download file `https://git-scm.com/download/win`
   -Execute file. 
   -Click *next*.
   -_Leave Defaults Checked_, click *next*
   -Select "Use Git from the Windows Command Prompt", click *next*.
   -Select "Use OpenSSH".
   -Select "Checkout as-is, commit Unix-style line endings", click *next*
   -Select "Use MinTTY", click *next*
   -Leave defaults checked, click *Install*
   -Uncheck View Release Notes, click *Finish*
4. Open Git Bash *as an Administrator*.
5. Change to a directory where you would like to store eventkit-cloud source and configuration. (if change a drive use `cd <letter>:`)
6. run: `git clone https://github.com/venicegeo/eventkit-cloud`
7. `cd eventkit-cloud`
8. `vagrant plugin install vagrant-hostsupdater`
9. `vagrant plugin install vagrant-reload`
10. `vagrant plugin install vagrant-vbguest`
11. `vagrant up docker`
Step 11 will take many minutes while it.  It will download the base linux image and cache it to your computer and then download all of the docker dependencies.
12. `vagrant ssh docker`
13. `cd /vagrant`
14. `sudo docker-compose run --rm eventkit python manage.py runinitial setup`
15. `sudo docker-compose up`

Step 14 and 15 will take a long time as each containers image is downloaded and configured, once this is done you will see the logs from the containers as they start, eventually you will see the eventkit container have listening on 0.0.0.0:6080 at that point you can open a browser and navigate to *cloud.eventkit.test*

# Pulling Updates
When a new update is pushed to master you can view the latest code:
1. Open Git Bash *as an Administrator*.
2. Change to the eventkit-cloud directory.
3. `git pull`
4. `vagrant up docker`
5. `vagrant ssh docker`
6. `cd /vagrant`
7. `sudo docker-compose run --rm eventkit python manage.py runinitial`
8. `sudo docker-compose up`