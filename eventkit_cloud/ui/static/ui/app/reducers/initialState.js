
export default {
    jobs: [],
    bbox: [],
    aoiInfo: {
        geojson: {},
        geomType: null,
        title: null,
        description: null,
    },
    mode: 'DRAW_NORMAL',
    showInvalidDrawWarning: false,
    showImportModal: false,
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
