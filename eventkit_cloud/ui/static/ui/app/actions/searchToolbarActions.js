import axios from 'axios';

export function getGeocode(query) {
    return (dispatch) => {
        dispatch({ type: 'FETCHING_GEOCODE' });
        return axios.get('/search', {
            params: {
                query,
            },
        }).then(response => (response.data))
            .then((responseData) => {
                const features = responseData.features || [];
                const data = [];
                features.forEach((feature) => {
                    if (feature.geometry) {
                        // prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                        Object.keys(feature.properties).forEach((k) => {
                            feature[k] = feature.properties[k];
                        });
                        data.push(feature);
                    }
                });
                dispatch({ type: 'RECEIVED_GEOCODE', data });
            })
            .catch((error) => {
                dispatch({ type: 'GEOCODE_ERROR', error });
            });
    };
}
