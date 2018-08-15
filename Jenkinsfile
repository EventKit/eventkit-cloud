#!/usr/bin/groovy

node {

    stage("Setup") {
        deleteDir()
        if(env.GIT_CREDS) {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}", credentialsId: "${env.GIT_CREDS}"
        } else {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}"
        }
        postStatus(getPendingStatus("The build is starting..."))
    }

    stage("Add Repo"){
        def urlPath = getURLPath()
        sh "echo build path is: $urlPath"
        sh "ls -al"
        if(env.CONDA_REPO){
            sh """
python - << END
import yaml

data = {}
with open('environment-dev.yml', 'r') as yaml_file:
    data = yaml.load(yaml_file)
data['channels'] = ['$env.CONDA_REPO']

with open('environment-dev.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)

END
"""
        }
        sh "cat environment-dev.yml"
    }

    stage("Build"){
        try{
            postStatus(getPendingStatus("Building the docker containers..."))
            sh "docker-compose build"
        }catch(Exception e) {
             postStatus(getFailureStatus("Failed to build docker containers."))
             throw e
        }
    }

    stage("Run linter"){
        try{
            postStatus(getPendingStatus("Running the linters..."))
            sh "docker-compose run --rm -T webpack npm run lint"
        }catch(Exception e) {
            postStatus(getFailureStatus("Lint checks failed."))
            throw e
        }
    }

    stage("Run unit tests"){
        try{
            postStatus(getPendingStatus("Running the unit tests..."))
            sh "docker-compose run --rm -T eventkit pytest -n"
            sh "docker-compose run --rm -T webpack npm test"
        }catch(Exception e) {
             postStatus(getFailureStatus("Unit tests failed."))
             throw e
        }
    }

    stage("Run integration tests"){
        try{
            postStatus(getPendingStatus("Running the integration tests..."))
            sh "docker-compose exec -T eventkit pytest -n"
            sh "docker-compose up -d && docker-compose run --rm -T eventkit python manage.py run_integration_tests eventkit_cloud.jobs.tests.integration_test_jobs.TestJob.test_loaded || docker-compose down"
            postStatus(getSuccessStatus("All tests passed!"))
        }catch(Exception e) {
            postStatus(getFailureStatus("Integration tests failed."))
            throw e
        }
    }
}


def postStatus(status){
  if(env.GIT_URL.contains('github') && env.SET_STATUS.toBoolean()){
      def url = getStatusURL()
      sh "curl -b --header 'Content-Type: application/json' --request POST --data '${status}' ${url}"
  }
}


def getStatusURL(){
    withCredentials([string(credentialsId: 'githubToken', variable: 'GITHUB_TOKEN')])  {
        def git_sha = getGitSHA()
        return "${env.GIT_API}/statuses/${git_sha}?access_token=${GITHUB_TOKEN}"
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
  return "{\"state\":\"pending\",\"target_url\":\"${getURLPath}\",\"description\":\"${message}\",\"context\":\"ci/jenkins\"}"
}

def getSuccessStatus(message){
  return "{\"state\":\"success\",\"target_url\":\"${getURLPath}\",\"description\":\"${message}\",\"context\":\"ci/jenkins\"}"
}

def getFailureStatus(message){
  return "{\"state\":\"failure\",\"target_url\":\"${getURLPath}\",\"description\":\"${message}\",\"context\":\"ci/jenkins\"}"
}
