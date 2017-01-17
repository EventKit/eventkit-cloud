
export default {
    jobs: [],
    bbox: [],
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
    mode: 'DRAW_NORMAL',
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
