#!/usr/bin/groovy

node {

String failureStatus = '{"state":"failure","description":"This build has failed.","context":"continuous-integration/jenkins"}'

String pendingStatus = '{"state":"pending","description":"This build is pending.","context":"continuous-integration/jenkins"}'

String successStatus = '{"state":"success","description":"This build has succeeded.","context":"continuous-integration/jenkins"}'

    stage("Setup") {
        deleteDir()
        if(env.GIT_CREDS) {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}", credentialsId: "${env.GIT_CREDS}"
        } else {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}"
        }
        postStatus(pendingStatus)
    }

    stage("Add Repo"){

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
        sh "docker-compose build"
    }

    stage("Run linter"){
        sh "docker-compose run --rm -T webpack npm run lint"
    }

    stage("Run unit tests"){
        sh "docker-compose run --rm -T eventkit pytest -n"
        sh "docker-compose run --rm -T webpack npm test"
    }

    stage("Run integration tests"){
        sh "docker-compose exec -T eventkit pytest -n"
        sh "docker-compose up -d && docker-compose run --rm -T eventkit python manage.py run_integration_tests eventkit_cloud.jobs.tests.integration_test_jobs.TestJob.test_loaded || docker-compose down"
    }

    post {
        success {
            postStatus(successStatus)
        }
        failure {
            postStatus(failureStatus)
        }
    }
}


def postStatus(status){
  if(env.GIT_URL.contains('github') && env.SET_STATUS.toBoolean()){
  }
  def url = getStatusURL()
  sh "curl -b --header 'Content-Type: application/json' --request POST --data ${status} ${url}"
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