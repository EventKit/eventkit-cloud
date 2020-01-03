import * as reducers from '../../reducers/projectionReducer';

describe('getProjectionsReducer', () => {
    it('should return the initial state', () => {
        expect(reducers.getProjectionsReducer(undefined, {})).toEqual([]);
    });

    it('should handle GETTING_PROJECTIONS', () => {
        expect(reducers.getProjectionsReducer(
            { projections: [{ id: 'fakeprojection' }] },
            { type: 'GETTING_PROJECTIONS' },
        )).toEqual([]);
    });

    it('should handle PROJECTIONS_RECEIVED', () => {
        expect(reducers.getProjectionsReducer(
            { projections: [] },
            {
                projections: [{ id: 'fakeprojection' }],
                type: 'PROJECTIONS_RECEIVED',
            },
        )).toEqual([{ id: 'fakeprojection' }]);
    });
});
