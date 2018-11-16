
export const types = {
    GETTING_FORMATS: 'GETTING_FORMATS',
    FORMATS_RECEIVED: 'FORMATS_RECEIVED',
    GETTING_FORMATS_ERROR: 'GETTING_FORMATS_ERROR',
};

export function getFormats() {
    return {
        types: [
            types.GETTING_FORMATS,
            types.FORMATS_RECEIVED,
            types.GETTING_FORMATS_ERROR,
        ],
        url: '/api/formats',
        method: 'GET',
        onSuccess: response => ({ formats: response.data }),
    };
}
