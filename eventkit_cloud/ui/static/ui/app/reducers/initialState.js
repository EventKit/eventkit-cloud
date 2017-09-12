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
    drawerOpen: false,
    runsList: {
        fetching: false,
        fetched: false,
        runs: [],
        error: null,
        nextPage: false,
        range: '',
        order: '',
        view: '',
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
        layers: 'Geopackage',
    },
    providers: [],
    stepperNextEnabled: false,
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
    updateExpiration: {
        updating: false,
        updated: false,
        error: null,
    },
    updatePermission: {
        updating: false,
        updated: false,
        error: null,
    },
    formats: [],
}
