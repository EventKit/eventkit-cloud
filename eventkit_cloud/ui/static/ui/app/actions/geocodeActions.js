
export const types = {
    FETCHING_GEOCODE: 'FETCHING_GEOCODE',
    RECEIVED_GEOCODE: 'RECEIVED_GEOCODE',
    FETCH_GEOCODE_ERROR: 'FETCH_GEOCODE_ERROR',
};

export function getGeocode(query) {
    return {
        types: [
            types.FETCHING_GEOCODE,
            types.RECEIVED_GEOCODE,
            types.FETCH_GEOCODE_ERROR,
        ],
        getCancelSource: state => state.geocode.cancelSource,
        cancellable: true,
        url: '/search',
        method: 'GET',
        params: { query },
        onSuccess: (response) => {
            const features = response.data.features || [];
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
            return { data };
        },
        onError: (e) => {
            let error = e.response.data;
            if (!error) {
                error = 'An unknown error has occured';
            }
            return { error };
        },
    };
}
