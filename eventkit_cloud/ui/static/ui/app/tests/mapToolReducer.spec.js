import * as reducers from '../reducers/mapToolReducer';

describe('toolbarIcons reducer', () => {
    it('should return the intitial state', () => {
        expect(reducers.toolbarIconsReducer(undefined, {})).toEqual(
            {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            }
        );
    });

    it('should handle SET_BOX_SELECTED', () => {
        expect(reducers.toolbarIconsReducer(
            {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            },
            {type: 'SET_BOX_SELECTED'}
        )).toEqual(
            {
                box: 'SELECTED',
                free: 'INACTIVE',
                mapView: 'INACTIVE',
                import: 'INACTIVE',
            }
        );
    });

    it('should handle SET_FREE_SELECTED', () => {
        expect(reducers.toolbarIconsReducer(
            {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            },
            {type: 'SET_FREE_SELECTED'}
        )).toEqual(
            {
                box: 'INACTIVE',
                free: 'SELECTED',
                mapView: 'INACTIVE',
                import: 'INACTIVE',
            }
        );
    });

    it('should handle SET_VIEW_SELECTED', () => {
        expect(reducers.toolbarIconsReducer(
            {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            },
            {type: 'SET_VIEW_SELECTED'}
        )).toEqual(
            {
                box: 'INACTIVE',
                free: 'INACTIVE',
                mapView: 'SELECTED',
                import: 'INACTIVE',
            }
        );
    });

    it('should handle SET_IMPORT_SELECTED', () => {
        expect(reducers.toolbarIconsReducer(
            {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
            },
            {type: 'SET_IMPORT_SELECTED'}
        )).toEqual(
            {
                box: 'INACTIVE',
                free: 'INACTIVE',
                mapView: 'INACTIVE',
                import: 'SELECTED',
            }
        );
    });

    it('should handle SET_BUTTONS_DEFAULT', () => {
        expect(reducers.toolbarIconsReducer(
            {
                box: 'INACTIVE',
                free: 'INACTIVE',
                mapView: 'INACTIVE',
                import: 'SELECTED',
            },
            {type: 'SET_BUTTONS_DEFAULT'}
        )).toEqual(
            {
                box: "DEFAULT",
                free: "DEFAULT",
                mapView: "DEFAULT",
                import: "DEFAULT",
            }
        );
    });
});

describe('showImportModal reducer', () => {
    it('should handle default', () => {
        expect(reducers.showImportModalReducer(undefined, {})).toEqual(
            false
        );
    });

    it('should handle SET_IMPORT_MODAL_STATE', () => {
        expect(reducers.showImportModalReducer(false,
            {type: 'SET_IMPORT_MODAL_STATE', showImportModal: true}
        )).toEqual(true);
    });
});

describe('importGeom reducer', () => {
    it('should handle default', () => {
        expect(reducers.importGeomReducer(undefined, {})).toEqual(
            {
                processing: false,
                processed: false,
                geom: {},
                error: null,
            }
        );
    });

    it('should handle FILE_PROCESSING', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                geom: {},
                error: null,
            },
            {type: 'FILE_PROCESSING'}
        )).toEqual(
            {
                processing: true,
                processed: false,
                geom: {},
                error: null,
            }
        );
    });

    it('should handle FILE_PROCESSED', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                geom: {},
                error: null,
            },
            {type: 'FILE_PROCESSED', geom: {data: 'here'}}
        )).toEqual(
            {
                processing: false,
                processed: true,
                geom: {data: 'here'},
                error: null,
            }
        );
    });

    it('should handle FILE_ERROR', () => {
        expect(reducers.importGeomReducer(
            {
                processing: true,
                processed: false,
                geom: {},
                error: null,
            },
            {type: 'FILE_ERROR', error: 'This is an error'}
        )).toEqual(
            {
                processing: false,
                processed: false,
                geom: {},
                error: 'This is an error',
            }
        );
    });

    it('should handle FILE_RESET', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: true,
                geom: {},
                error: null,
            },
            {type: 'FILE_RESET'}
        )).toEqual(
            {
                processing: false,
                processed: false,
                geom: {},
                error: null,
            }
        );
    });
});
