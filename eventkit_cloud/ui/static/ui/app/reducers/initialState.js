
export default {
    jobs: [],
    bbox: [],
    geojson: {},
    mode: 'DRAW_NORMAL',
    showInvalidDrawWarning: false,
    searchBbox : [],
    drawExtensionVisible: false,
    drawCancel: {
        disabled: true,
        click: false,
    },
    drawRedraw: {
        disabled: true,
        click: false,
    },
    drawSet: {
        disabled: true,
        click: false,
    },

    drawBoxButton: {
        disabled: true,
        click: false,
    },
    drawFreeButton: {
        disabled: true,
        click: false,
    },
    zoomToSelection: {
        disabled: true,
        click: false
    },
    resetMap: {
        disabled: true,
        click: false
    },
    geonames: {
        fetching: false,
        fetched: false,
        geonames: [],
        error: null,
    },
}
