import * as actions from '../../actions/topicActions';

describe('topic actions', () => {
    it('should return the correct types', () => {
        expect(actions.getTopics().types).toEqual([
            actions.types.GETTING_TOPICS,
            actions.types.TOPICS_RECEIVED,
            actions.types.GETTING_TOPICS_ERROR,
        ]);
    });

    it('onSuccess should return topics', () => {
        const rep = { data: ['topicOne', 'topicTwo'] };
        expect(actions.getTopics().onSuccess(rep)).toEqual({
            topics: rep.data,
        });
    });
});
