import * as actions from '../../actions/formatActions';

describe('format actions', () => {
    it('should return the correct types', () => {
        expect(actions.getFormats().types).toEqual([
            actions.types.GETTING_FORMATS,
            actions.types.FORMATS_RECEIVED,
            actions.types.GETTING_FORMATS_ERROR,
        ]);
    });

    it('onSuccess should return formats', () => {
        const rep = { data: ['formatOne', 'formatTwo'] };
        expect(actions.getFormats().onSuccess(rep)).toEqual({
            formats: rep.data,
        });
    });
});
