
export const types = {
    FETCHING_LICENSES: 'FETCHING_LICENSES',
    RECEIVED_LICENSES: 'RECEIVED_LICENSES',
    FETCH_LICENSES_ERROR: 'FETCH_LICENSES_ERROR',
};

export function getLicenses() {
    return {
        types: [
            types.FETCHING_LICENSES,
            types.RECEIVED_LICENSES,
            types.FETCH_LICENSES_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        url: '/api/licenses',
        method: 'GET',
        onSuccess: response => ({ licenses: response.data }),
        onError: error => ({ error: error.response.data }),
    };
}

export default getLicenses;
