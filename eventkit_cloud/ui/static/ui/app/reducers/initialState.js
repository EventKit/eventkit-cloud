
export default {
    jobs: [],
    bbox: [],
    geojson: {},
    mode: 'DRAW_NORMAL',
    isAOISet: false,
    showInvalidDrawWarning: false,
    showImportModal: false,
    searchBbox : [],
    drawSet: {
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
    importGeom: {
        processing: false,
        processed: false,
        geom: {},
        error: null,
    },
    toolbarIcons: {
        box: "DEFAULT",
        free: "DEFAULT",
        mapView: "DEFAULT",
        import: "DEFAULT",
    }
}
