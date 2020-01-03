import * as reducers from '../../reducers/fileReducer';

describe('importGeom reducer', () => {
    it('should handle default', () => {
        expect(reducers.importGeomReducer(undefined, {})).toEqual({
            error: null,
            featureCollection: {},
            filename: '',
            processed: false,
            processing: false,
        });
    });

    it('should handle FILE_PROCESSING', () => {
        expect(reducers.importGeomReducer(
            {
                error: null,
                featureCollection: {},
                processed: false,
                processing: false,
            },
            { type: 'FILE_PROCESSING', filename: 'file.txt' },
        )).toEqual({
            error: null,
            featureCollection: {},
            filename: 'file.txt',
            processed: false,
            processing: true,
        });
    });

    it('should handle FILE_PROCESSED', () => {
        expect(reducers.importGeomReducer(
            {
                error: null,
                featureCollection: {},
                filename: '',
                processed: false,
                processing: false,
            },
            { type: 'FILE_PROCESSED', featureCollection: { data: 'here' } },
        )).toEqual({
            error: null,
            featureCollection: { data: 'here' },
            filename: '',
            processed: true,
            processing: false,
        });
    });

    it('should handle FILE_ERROR', () => {
        expect(reducers.importGeomReducer(
            {
                error: null,
                featureCollection: {},
                filename: '',
                processed: false,
                processing: true,
            },
            { type: 'FILE_ERROR', error: 'This is an error' },
        )).toEqual({
            error: 'This is an error',
            featureCollection: {},
            filename: '',
            processed: false,
            processing: false,
        });
    });

    it('should handle FILE_RESET', () => {
        expect(reducers.importGeomReducer(
            {
                error: null,
                featureCollection: {},
                filename: 'some-name.file',
                processed: true,
                processing: false,
            },
            { type: 'FILE_RESET' },
        )).toEqual({
            error: null,
            featureCollection: {},
            filename: '',
            processed: false,
            processing: false,
        });
    });
});
