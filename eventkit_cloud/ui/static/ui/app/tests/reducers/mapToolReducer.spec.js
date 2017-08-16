import * as reducers from '../../reducers/mapToolReducer';

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
