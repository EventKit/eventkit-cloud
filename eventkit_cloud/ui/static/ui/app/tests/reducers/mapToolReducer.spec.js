import * as reducers from '../../reducers/mapToolReducer';

describe('importGeom reducer', () => {
    it('should handle default', () => {
        expect(reducers.importGeomReducer(undefined, {})).toEqual(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
            }
        );
    });

    it('should handle FILE_PROCESSING', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
            },
            {type: 'FILE_PROCESSING'}
        )).toEqual(
            {
                processing: true,
                processed: false,
                featureCollection: {},
                error: null,
            }
        );
    });

    it('should handle FILE_PROCESSED', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
            },
            {type: 'FILE_PROCESSED', featureCollection: {data: 'here'}}
        )).toEqual(
            {
                processing: false,
                processed: true,
                featureCollection: {data: 'here'},
                error: null,
            }
        );
    });

    it('should handle FILE_ERROR', () => {
        expect(reducers.importGeomReducer(
            {
                processing: true,
                processed: false,
                featureCollection: {},
                error: null,
            },
            {type: 'FILE_ERROR', error: 'This is an error'}
        )).toEqual(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: 'This is an error',
            }
        );
    });

    it('should handle FILE_RESET', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: true,
                featureCollection: {},
                error: null,
            },
            {type: 'FILE_RESET'}
        )).toEqual(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
            }
        );
    });
});
