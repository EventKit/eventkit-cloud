
export const types = {
    FORMATS_RECEIVED: 'FORMATS_RECEIVED',
    GETTING_FORMATS: 'GETTING_FORMATS',
    GETTING_FORMATS_ERROR: 'GETTING_FORMATS_ERROR',
};

export function getFormats() {
    return {
        method: 'GET',
        onSuccess: response => ({ formats: response.data }),
        types: [
            types.FORMATS_RECEIVED,
            types.GETTING_FORMATS,
            types.GETTING_FORMATS_ERROR,
        ],
        url: '/api/formats',
    };
}
