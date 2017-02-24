import * as api from '../config'
import fetch from 'isomorphic-fetch'

class ExportsApi {

    static getAllJobs() {
        return fetch('/api/jobs').then(response => {
        //return fetch(api.Config.JOBS_URL).then(response => {
         return response.json();
        }).catch(error => {
            return error;
        });
    }

    static createExport(exportData) {
        console.log(exportData);
    }
}

export default ExportsApi;