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
                        const featureCopy = { ...feature };
                        // prep data for TypeAhead https://github.com/ericgio/react-bootstrap-typeahead/blob/master/docs/Data.md
                        Object.keys(featureCopy.properties).forEach((k) => {
                            featureCopy[k] = featureCopy.properties[k];
                        });
                        data.push(featureCopy);
                    }
                });
                dispatch({ type: 'RECEIVED_GEOCODE', data });
            })
            .catch((e) => {
                let error = e.response.data;
                if (!error) {
                    error = 'An unknown error has occured';
                }
                dispatch({ type: 'FETCH_GEOCODE_ERROR', error });
            });
    };
}
