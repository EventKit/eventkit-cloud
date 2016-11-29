import * as api from '../config'
class ExportsApi {


    static getAllJobs() {
        return fetch(api.Config.JOBS_URL).then(response => {
         return response.json();
        }).catch(error => {
            return error;
        });
    }
}

export default ExportsApi;