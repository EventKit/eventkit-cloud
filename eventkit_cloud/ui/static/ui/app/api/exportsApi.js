import * as api from '../config'
import fetch from 'isomorphic-fetch'

class ExportsApi {

    static getAllJobs() {
        return fetch('http://http://cloud.eventkit.dev:8080/api/jobs').then(response => {
        //return fetch(api.Config.JOBS_URL).then(response => {
         return response.json();
        }).catch(error => {
            return error;
        });
    }
}

export default ExportsApi;