import { initialState as userInitialState } from './userReducer'
import { initialState as authInitialState } from './userReducer'

export default {
    auth: authInitialState,
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
    geocode: {
        fetching: false,
        fetched: false,
        data: [],
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
    drawerOpen: false,
    runsList: {
        fetching: false,
        fetched: false,
        runs: [],
        error: null,
    },
    runsDeletion: {
        deleting: false,
        deleted: false,
        error: null,
    },
    submitJob: {
        fetching: false,
        fetched: false,
        jobuid: '',
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
    datacartDetailsReceived:false,
    datacartDetails: {
        fetching: false,
        fetched: false,
        data: [],
        error: null,
    },
    runDeletion: {
        deleting: false,
        deleted: false,
        error: null,
    },
    exportReRun: {
        fetching: false,
        fetched: false,
        data: [],
        error: null,
    },
    licenses: {
        fetching: false,
        fetched: false,
        licenses: [],
        error: null
    },
    cancelProviderTask: {
        canceling: false,
        canceled: false,
        error: null,
    },
}
