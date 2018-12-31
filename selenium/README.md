# Eventkit Selenium Tests

The Eventkit Selenium tests exist as a Java WebDriver project that is designed to interact with a remote instance of a Selenium Grid server running a Chrome Driver.

# Instructions

To run the tests locally, perform the following steps:

* Ensure Docker is installed and configured on your local machine
* Set up the following variables in your environment:
  * `ek_password` The EventKit user account password to use
  * `ek_username` The EventKit user account name to use
  * `ek_url` The URL of eventkit to test. Three login pages are currently supported:
      * the geoaxis login page.
      * the api login page: /api/login/?next=dashboard
      * the local instance login page i.e. http://cloud.eventkit.test/
* From this `selenium` directory, run `docker-compose up` to run the tests.

