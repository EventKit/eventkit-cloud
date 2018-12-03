# Beachfront Selenium Tests

The Beachfront Selenium tests exist as a Java WebDriver project that is designed to interact with a remote instance of a Selenium Grid server running a Chrome Driver.

# Instructions

To run the tests locally, perform the following steps:

* Ensure Docker is installed and configured on your local machine
* Clone the following repository  https://github.com/SeleniumHQ/docker-selenium/tree/master/StandaloneChrome
* Navigate to the `StandaloneChrome` directory in that repository and run the command `docker run -d -p 4444:4444 -v /dev/shm:/dev/shm selenium/standalone-chrome` to start the Selenium Grid server.
* Set up the following variables in your environment:
TODO: Determine variables needed for eventkit
  * `ek_password` The Disadvantaged user account password to use
  * `ek_username` The Disadvantaged user account name to use
  * `ek_url` The URL of beachfront to test.
* From this `bftest-integration/ci/Selenium/` directory, run `mvn clean test` to run the tests. These tests will take a few minutes. 

# JenkinsFile

The JenkinsFile to run these Selenium tests in Jenkins exists in the root directory of this repository `selenium/JenkinsFile.Selenium`. This JenkinsFile uses the same Docker container as mentioned above to ensure a consistent testing environment.