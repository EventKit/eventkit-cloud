import axios from 'axios';

export const types = {
    FETCHING_GEOCODE: 'FETCHING_GEOCODE',
    RECEIVED_GEOCODE: 'RECEIVED_GEOCODE',
    FETCH_GEOCODE_ERROR: 'FETCH_GEOCODE_ERROR',
};

export function getGeocode(query) {
    return (dispatch) => {
        dispatch({ type: types.FETCHING_GEOCODE });
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
                dispatch({ type: types.RECEIVED_GEOCODE, data });
            })
            .catch((e) => {
                let error = e.response.data;
                if (!error) {
                    error = 'An unknown error has occured';
                }
                dispatch({ type: types.FETCH_GEOCODE_ERROR, error });
            });
    };
}
