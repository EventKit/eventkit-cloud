import axios from 'axios';
import cookie from 'react-cookie';


export default (username, password) => dispatch => {

    return axios.get('/login/')
        .then((response) => {
            csrfmiddlewaretoken = cookie.load('csrftoken');
            const form_data = new FormData();
            form_data.append('username', username);
            form_data.append('password', password);
            form_data.append('csrfmiddlewaretoken', csrfmiddlewaretoken);
            axios({
                url: '/login/',
                method: 'post',
                data: form_data,
                headers: {"X-CSRFToken": csrfmiddlewaretoken}
            })
        }).catch((error) => {
            console.log(error);
    });
}