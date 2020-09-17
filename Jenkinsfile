node() {

    stage('Clean Up Workspace') {
        cleanWs()
    }

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
    data = yaml.safe_load(yaml_file)
data['channels'] = ['local', '$CONDA_REPO']

with open('environment-dev.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)

END
"""
            }
            sh "cat environment-dev.yml"
        }
    }

  
    // Getting the host IP for Jenkins doesn't work.
    // Point to the internal django container instead at port 6080.
    stage("Run integration tests"){
        try{
            postStatus(getPendingStatus("Running the integration tests..."))
            withEnv([
                "BASE_URL=http://cloud.eventkit.test:6080",
                "SITE_NAME=cloud.eventkit.test",
                "SITE_IP=127.0.0.1",
                "SSL_VERIFICATION=False"
            ]) {
                sh "docker-compose down && docker-compose up -d --scale celery=3"
                sh "docker-compose exec --user root -T eventkit chown eventkit:eventkit -R ."
                sh "docker-compose exec -T eventkit bash -c 'source activate eventkit-cloud && python manage.py migrate'"
                // Stop unnecessary services
                sh "docker-compose stop flower map mkdocs"
                // This can fail if using a stale database during a rerun.  If it fails to add any of this data because it already exists just continue.
                sh "docker-compose exec -T eventkit bash -c 'source activate eventkit-cloud && python manage.py loaddata admin_user osm_provider datamodel_presets' || exit 0"
                sh "docker-compose exec -T eventkit bash -c 'source activate eventkit-cloud && python manage.py run_integration_tests'"
            }
            postStatus(getSuccessStatus("All tests passed!"))
            sh "docker-compose down"
        }catch(Exception e) {
            sh "docker-compose logs --tail=50"
            handleErrors("Integration tests failed.")
        }
    }
}


def postStatus(status){
    withCredentials([usernamePassword(credentialsId: 'githubToken',
                                      passwordVariable: 'GITHUB_TOKEN',
                                      usernameVariable: 'GITHUB_USER')])  {
      def git_url = sh(returnStdout: true, script: 'git config remote.origin.url').trim()
      if(git_url.contains('github')){
          def git_sha = getGitSHA()
          sh "curl -u \"${GITHUB_USER}:${GITHUB_TOKEN}\" -H \"Content-Type: application/json\" -d '${status}' https://api.github.com/repos/eventkit/eventkit-cloud/statuses/${git_sha}"
      }
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
    data = yaml.safe_load(yaml_file)
for service in data.get('services'):
    data['services'][service].pop('volumes', "")
with open('docker-compose.yml', 'w') as outfile:
    yaml.dump(data, outfile, default_flow_style=False)
END
    """
}
