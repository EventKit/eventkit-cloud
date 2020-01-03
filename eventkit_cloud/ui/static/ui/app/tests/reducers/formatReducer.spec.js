import * as reducers from '../../reducers/formatReducer';

describe('getFormatsReducer', () => {
    it('should return the initial state', () => {
        expect(reducers.getFormatsReducer(undefined, {})).toEqual([]);
    });

    it('should handle GETTING_FORMATS', () => {
        expect(reducers.getFormatsReducer(
            { formats: [{ id: 'fakeformat' }] },
            { type: 'GETTING_FORMATS' },
        )).toEqual([]);
    });

    it('should handle FORMATS_RECEIVED', () => {
        expect(reducers.getFormatsReducer(
            { formats: [] },
            {
                formats: [{ id: 'fakeformat' }],
                type: 'FORMATS_RECEIVED',
            },
        )).toEqual([{ id: 'fakeformat' }]);
    });
});
