import * as reducers from '../reducers/statusDownloadReducer';


describe('StatusDownload reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.getDatacartDetailsReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            }
        );
    });

    it('should handle GETTING_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null},
            {
                type: 'GETTING_DATACART_DETAILS'
            }
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                data: [],
                error: null
            }
        );
    });

    it('should handle DATACART_DETAILS_RECEIVED', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null
            },
            {
                type: 'DATACART_DETAILS_RECEIVED', datacartDetails: { data: [{thisIs: 'a fake datacart'}]}
            }
        )).toEqual(
            {
                fetching: false,
                fetched: true,
                data: [{thisIs: 'a fake datacart'}],
                error: null
            }
        );
    });
    it('should handle DATACART_DETAILS_ERROR', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null
            },
            {
                type: 'DATACART_DETAILS_ERROR', error: 'This is an error message'
            }
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: 'This is an error message'
            }
        );
    })
});

describe('setDatacartDetailsReducer Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.setDatacartDetailsReducer(undefined, {})).toEqual(false);
    });
    it('should handle DATACART_DETAILS_RECEIVED_FLAG', () => {
        expect(reducers.setDatacartDetailsReducer(
            true,
            {type: 'DATACART_DETAILS_RECEIVED_FLAG'}
        )).toEqual(true);
    });
});

describe('DeleteRuns Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.deleteRunReducer(undefined, {})).toEqual(
            {
                deleting: false,
                deleted: false,
                error: null
            }
        );
    });

    it('should handle DELETING_RUN', () => {
        expect(reducers.deleteRunReducer(
            {
                deleting: false,
                deleted: false,
                error: null
            },
            {
                type: 'DELETING_RUN'
            }
        )).toEqual(
            {
                deleting: true,
                deleted: false,
                error: null
            }
        );
    });
    it('should handle DELETED_RUN', () => {
        expect(reducers.deleteRunReducer(
            {
                deleting: true,
                deleted: false,
                error: null
            },
            {
                type: 'DELETED_RUN'
            }
        )).toEqual(
            {
                deleting: false,
                deleted: true,
                error: null
            }
        );
    });
    it('should handle DELETE_RUN_ERROR', () => {
        expect(reducers.deleteRunReducer(
            {
                deleting: true,
                deleted: false,
                error: null
            },
            {
                type: 'DELETE_RUN_ERROR',
                error: 'This is an error'
            }
        )).toEqual(
            {
                deleting: false,
                deleted: false,
                error: 'This is an error'
            }
        );
    });
})

describe('rerunExport Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.rerunExportReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            }
        );
    });

    it('should handle RERUNNING_EXPORT', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUNNING_EXPORT'
            }
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                data: '',
                error: null
            }
        );
    });
    it('should handle RERUN_EXPORT_SUCCESS', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUN_EXPORT_SUCCESS', exportReRun: { data: [{thisIs: 'a fake export rerun'}]}
            }
        )).toEqual(
            {
                fetching: false,
                fetched: true,
                data: [{thisIs: 'a fake export rerun'}],
                error: null,
            }
        );
    });
    it('should handle RERUN_EXPORT_ERROR', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUN_EXPORT_ERROR',
                error: 'This is an error'
            }
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                data: '',
                error: 'This is an error',
            }
        );
    });
    it('should handle CLEAR_RERUN_INFO', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'CLEAR_RERUN_INFO',

            }
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                data: '',
                error: null,
            }
        );
    });
})