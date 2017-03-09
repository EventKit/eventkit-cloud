import { initialState as userInitialState } from './userReducer'

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
        click: false
    },
    resetMap: {
        click: false
    },
    geonames: {
        fetching: false,
        fetched: false,
        geonames: [],
        error: null,
    },
    user: userInitialState,
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
        search: "DEFAULT",
    },
    drawerOpen: true,
    jobsList: {
        fetching: false,
        fetched: false,
        jobs: [],
        error: null,
    },
    exportInfo: {
        exportName: '',
        datapackDescription: '',
        projectName: '',
        makePublic: false,
        providers: [],
        area_str: '',
        layers: '',
    },
    providers: [],
    stepperNextEnabled: false,
    setExportPackageFlag: false,
}
