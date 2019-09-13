
export const types = {
    GETTING_PROJECTIONS: 'GETTING_PROJECTIONS',
    PROJECTIONS_RECEIVED: 'PROJECTIONS_RECEIVED',
    GETTING_PROJECTIONS_ERROR: 'GETTING_PROJECTIONS_ERROR',
};

export function getProjections() {
    return {
        types: [
            types.GETTING_PROJECTIONS,
            types.PROJECTIONS_RECEIVED,
            types.GETTING_PROJECTIONS_ERROR,
        ],
        url: '/api/projections',
        method: 'GET',
        onSuccess: response => ({ projections: response.data }),
    };
}
