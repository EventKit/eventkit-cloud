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

        removeVolumes()
    }

    stage("Build"){
        try{
            postStatus(getPendingStatus("Building the docker containers..."))
            sh "docker-compose down || exit 0"
            sh "docker system prune -f"
            sh "cd conda && docker-compose up --build && cd .."
            sh "docker-compose build --no-cache"
            // Exit 0 provided for when setup has already ran on a previous build.
            // This could hide errors at this step but they will show up again during the tests.
            // No use bringing up containers if integration tests aren't configured.
            // sh "docker-compose run --rm -T eventkit manage.py runinitial setup || exit 0"
            // sh "docker-compose up --force-recreate -d"
        }catch(Exception e) {
           handleErrors("Failed to build the docker containers.")
        }
    }

    stage("Run linter"){
        try{
            postStatus(getPendingStatus("Running the linters..."))
            sh "docker-compose run --rm -T  webpack npm run eslint"
        }catch(Exception e) {
            sh "docker-compose logs --tail=50 webpack"
            handleErrors("Lint checks failed.")
        }
    }

    stage("Run unit tests"){
        try{
            postStatus(getPendingStatus("Running the unit tests..."))
            sh "docker-compose run --rm -T  eventkit manage.py test -v=2 --noinput eventkit_cloud"
            sh "docker-compose run --rm -T  webpack npm test"
            postStatus(getSuccessStatus("All tests passed!"))
            sh "docker-compose down"
        }catch(Exception e) {
             sh "docker-compose logs --tail=50 eventkit webpack"
             handleErrors("Unit tests failed.")
        }
    }

// TODO: get integrations tests to run in jenkins, should the SITE_IP be discovered from the host or should docker try to
// communicate on an internal network?
//    stage("Run integration tests"){
//        try{
//                postStatus(getPendingStatus("Running the integration tests..."))
//                sh "docker-compose run --rm -T  eventkit manage.py run_integration_tests eventkit_cloud.jobs.tests.integration_test_jobs.TestJob.test_loaded"
//                postStatus(getSuccessStatus("All tests passed!"))
//        }catch(Exception e) {
//            sh "docker-compose logs --tail=50"
//            handleErrors("Integration tests failed.")
//        }
//    }
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

def handleErrors(message){
    postStatus(getFailureStatus(message))
    sh "docker-compose down"
    error(message)
}

def removeVolumes() {
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
}
