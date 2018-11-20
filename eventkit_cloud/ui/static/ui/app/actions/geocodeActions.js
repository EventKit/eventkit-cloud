import axios from 'axios';
import { makeAuthRequired } from './authActions';

export const types = {
    FETCHING_GEOCODE: 'FETCHING_GEOCODE',
    RECEIVED_GEOCODE: 'RECEIVED_GEOCODE',
    FETCH_GEOCODE_ERROR: 'FETCH_GEOCODE_ERROR',
};

export function getGeocode(query) {
    return (dispatch, getState) => {
        const { geocode } = getState();

        if (geocode.cancelSource) {
            geocode.cancelSource.cancel('Cancelling current request in favor of new search request');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch(makeAuthRequired({ type: types.FETCHING_GEOCODE, cancelSource: source }));

        return axios({
            url: '/search',
            method: 'GET',
            params: { query },
            cancelToken: source.token,
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
                dispatch(makeAuthRequired({ type: types.RECEIVED_GEOCODE, data }));
            })
            .catch((e) => {
                if (axios.isCancel(e)) {
                    console.warn(e.message);
                } else {
                    let error = e.response.data;
                    if (!error) {
                        error = 'An unknown error has occured';
                    }
                    dispatch(makeAuthRequired({ type: types.FETCH_GEOCODE_ERROR, error }));
                }
            });
    };
}
