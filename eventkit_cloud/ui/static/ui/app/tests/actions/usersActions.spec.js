import sinon from 'sinon';
import * as utils from '../../utils/generic';
import * as actions from '../../actions/usersActions';

describe('usersActions', () => {
    describe('getUsers action', () => {
        it('should return the correct types', () => {
            expect(actions.getUsers().types).toEqual([
                actions.types.FETCHING_USERS,
                actions.types.FETCHED_USERS,
                actions.types.FETCH_USERS_ERROR,
            ]);
        });

        it('getCancelSource should return the source', () => {
            const state = { users: { cancelSource: 'test' } };
            expect(actions.getUsers().getCancelSource(state)).toEqual('test');
        });

        it('onSuccess should return header info and users', () => {
            const ret = { headers: { 'total-users': 12 }, data: ['user1', 'user2'] };
            const headerStub = sinon.stub(utils, 'getHeaderPageInfo').returns({
                nextPage: false,
                range: '1-1',
            });
            expect(actions.getUsers().onSuccess(ret)).toEqual({
                users: ret.data,
                total: ret.headers['total-users'],
                range: '1-1',
                nextPage: false,
            });
            headerStub.restore();
        });
    });
});
