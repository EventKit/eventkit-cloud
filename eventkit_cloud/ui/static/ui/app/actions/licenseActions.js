
export const types = {
    FETCHING_LICENSES: 'FETCHING_LICENSES',
    FETCH_LICENSES_ERROR: 'FETCH_LICENSES_ERROR',
    RECEIVED_LICENSES: 'RECEIVED_LICENSES',
};

export function getLicenses() {
    return {
        method: 'GET',
        onSuccess: response => ({ licenses: response.data }),
        types: [
            types.FETCHING_LICENSES,
            types.FETCH_LICENSES_ERROR,
            types.RECEIVED_LICENSES,
        ],
        url: '/api/licenses',
    };
}

export default getLicenses;
