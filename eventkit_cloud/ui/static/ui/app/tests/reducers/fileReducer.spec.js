import * as reducers from '../../reducers/fileReducer';

describe('importGeom reducer', () => {
    it('should handle default', () => {
        expect(reducers.importGeomReducer(undefined, {})).toEqual({
            processing: false,
            processed: false,
            featureCollection: {},
            error: null,
            filename: '',
        });
    });

    it('should handle FILE_PROCESSING', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
            },
            { type: 'FILE_PROCESSING', filename: 'file.txt' },
        )).toEqual({
            processing: true,
            processed: false,
            featureCollection: {},
            error: null,
            filename: 'file.txt',
        });
    });

    it('should handle FILE_PROCESSED', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: false,
                featureCollection: {},
                error: null,
                filename: '',
            },
            { type: 'FILE_PROCESSED', featureCollection: { data: 'here' } },
        )).toEqual({
            processing: false,
            processed: true,
            featureCollection: { data: 'here' },
            error: null,
            filename: '',
        });
    });

    it('should handle FILE_ERROR', () => {
        expect(reducers.importGeomReducer(
            {
                processing: true,
                processed: false,
                featureCollection: {},
                error: null,
                filename: '',
            },
            { type: 'FILE_ERROR', error: 'This is an error' },
        )).toEqual({
            processing: false,
            processed: false,
            featureCollection: {},
            error: 'This is an error',
            filename: '',
        });
    });

    it('should handle FILE_RESET', () => {
        expect(reducers.importGeomReducer(
            {
                processing: false,
                processed: true,
                featureCollection: {},
                error: null,
                filename: 'some-name.file',
            },
            { type: 'FILE_RESET' },
        )).toEqual({
            processing: false,
            processed: false,
            featureCollection: {},
            error: null,
            filename: '',
        });
    });
});
