#!/usr/bin/groovy

node {

    stage("Add Repo"){
        checkout scm
        postStatus(getPendingStatus("The build is starting..."))
        withCredentials([string(credentialsId: 'condaRepo', variable: 'CONDA_REPO')]){
            sh "ls -al"
            if(CONDA_REPO){
                sh """
python - << END
import yaml

data = {}
with open('environment-dev.yml', 'r') as yaml_file:
    data = yaml.load(yaml_file)
data['channels'] = ['$CONDA_REPO']

with open('environment-dev.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)

END
"""
            }
            sh "cat environment-dev.yml"
        }
    }

    stage("Remove volumes"){
    // have to remove the volumes from docker because they mount stuff in jenkins

        sh """
python - << END
import yaml

data = {}
with open('docker-compose.yml', 'r') as yaml_file:
    data = yaml.load(yaml_file)
for service in data.get('services'):
    if data['services'][service].get('volumes'):
        data['services'][service].pop('volumes')
with open('docker-compose.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)

END
"""
        sh "cat docker-compose.yml"
    }

    stage("Build"){
        try{
            postStatus(getPendingStatus("Building the docker containers..."))
            sh "docker-compose build"
            sh "docker-compose up -d"
        }catch(Exception e) {
            postStatus(getFailureStatus("Failed to build docker containers."))
            throw e
        }
    }

    stage("Run linter"){
        try{
            postStatus(getPendingStatus("Running the linters..."))
            sh "docker-compose run --rm -T  webpack npm run lint"
        }catch(Exception e) {
            postStatus(getFailureStatus("Lint checks failed."))
            sh "docker-compose logs --tail=50 webpack > output.log"
            throw e
        }
    }

    stage("Run unit tests"){
        try{
            postStatus(getPendingStatus("Running the unit tests..."))
            sh "docker-compose run --rm -T  eventkit pytest -n 4"
            sh "docker-compose run --rm -T  webpack npm test"
        }catch(Exception e) {
             postStatus(getFailureStatus("Unit tests failed."))
             sh "docker-compose logs --tail=50 eventkit webpack"
             throw e
        }
    }

    stage("Run integration tests"){
        try{
            postStatus(getPendingStatus("Running the integration tests..."))
            sh "docker-compose run --rm -T  eventkit python manage.py run_integration_tests eventkit_cloud.jobs.tests.integration_test_jobs.TestJob.test_loaded || docker-compose down"
            postStatus(getSuccessStatus("All tests passed!"))
        }catch(Exception e) {
            postStatus(getFailureStatus("Integration tests failed."))
            sh "docker-compose logs --tail=50"
            throw e
        }
    }
}


def postStatus(status){

  def git_url = sh(returnStdout: true, script: 'git config remote.origin.url').trim()
  if(git_url.contains('github')){
      def status_url = getStatusURL()
      sh "curl -b --header 'Content-Type: application/json' --request POST --data '${status}' ${status_url}"
  }
}


def getStatusURL(){
    withCredentials([string(credentialsId: 'githubToken', variable: 'GITHUB_TOKEN')])  {
        def git_sha = getGitSHA()
        return "https://api.github.com/repos/venicegeo/eventkit-cloud/statuses/${git_sha}?access_token=${GITHUB_TOKEN}"
    }
}

def getGitSHA(){
    def sha = sh(script: "git rev-parse HEAD", returnStdout: true)
    return sha.trim()
}

def getURLPath(){
return sh(script:"echo ${env.BUILD_URL} | sed 's/https:\\/\\/[^\\/]*//'", returnStdout: true).trim()
}

def getPendingStatus(message){
  return "{\"state\":\"pending\",\"description\":\"${env.BUILD_NUMBER}-${message}\",\"context\":\"ci/jenkins\"}"
}

def getSuccessStatus(message){
  return "{\"state\":\"success\",\"description\":\"${env.BUILD_NUMBER}-${message}\",\"context\":\"ci/jenkins\"}"
}

def getFailureStatus(message){
  return "{\"state\":\"failure\",\"description\":\"${env.BUILD_NUMBER}-${message}\",\"context\":\"ci/jenkins\"}"
}
