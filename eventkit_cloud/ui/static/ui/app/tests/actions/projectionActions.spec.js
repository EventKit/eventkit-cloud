import * as actions from '../../actions/projectionActions';

describe('projection actions', () => {
    it('should return the correct types', () => {
        expect(actions.getProjections().types).toEqual([
            actions.types.GETTING_PROJECTIONS,
            actions.types.PROJECTIONS_RECEIVED,
            actions.types.GETTING_PROJECTIONS_ERROR,
        ]);
    });

    it('onSuccess should return projections', () => {
        const rep = { data: ['projectionOne', 'projectionTwo'] };
        expect(actions.getProjections().onSuccess(rep)).toEqual({
            projections: rep.data,
        });
    });
});
