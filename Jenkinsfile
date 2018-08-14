#!/usr/bin/groovy

node {

    stage("Setup") {
        deleteDir()
        if(env.GIT_CREDS) {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}", credentialsId: "${env.GIT_CREDS}"
        } else {
            git url: "${env.GIT_URL}", branch: "${env.GIT_BRANCH}"
        }
    }

    stage("add repo"){
        sh "ls -al"
        if(env.CONDA_REPO){
            sh """
python - << END
import yaml

data = {}
with open('environment.yml', 'r') as yaml_file:
    data = yaml.load(yaml_file)
data['channels'] = ['$env.CONDA_REPO'] + data['channels']

with open('environment.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)

END
"""
        }
        sh "cat environment.yml"
    }

    stage("Build docker"){
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


}