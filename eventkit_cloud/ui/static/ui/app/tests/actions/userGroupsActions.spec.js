import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/userGroupsActions';
import types from '../../actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('userGroups actions', () => {
    it('getGroups handle received groups', () => {
        const cancelSource = axios.CancelToken.source();
        const sourceStub = sinon.stub(axios.CancelToken, 'source')
            .returns(cancelSource);
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const groups = [
            { name: 'group1' },
        ];

        mock.onGet('/api/groups').reply(200, groups);

        const expectedActions = [
            { type: types.FETCHING_GROUPS, cancelSource },
            { type: types.FETCHED_GROUPS, groups },
        ];
        const store = mockStore({
            groups: {
                fetching: false,
                cancelSource: null,
            },
        });

        return store.dispatch(actions.getGroups())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                sourceStub.restore();
            });
    });

    it('getGroups should handle request error', () => {
        const cancelSource = axios.CancelToken.source();
        const sourceStub = sinon.stub(axios.CancelToken, 'source')
            .returns(cancelSource);
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const error = 'oh no and error';

        mock.onGet('/api/groups').reply(400, error);

        const expectedActions = [
            { type: types.FETCHING_GROUPS, cancelSource },
            { type: types.FETCH_GROUPS_ERROR, error },
        ];
        const store = mockStore({
            groups: {
                fetching: false,
                cancelSource: null,
            },
        });

        return store.dispatch(actions.getGroups())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                sourceStub.restore();
            });
    });

    it('getGroups should cancel a in progress request before making a new one', () => {
        const cancelSource = axios.CancelToken.source();
        cancelSource.cancel = sinon.spy();
        const sourceStub = sinon.stub(axios.CancelToken, 'source')
            .returns(cancelSource);
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onGet('/api/groups').reply(200, []);

        const store = mockStore({
            groups: {
                fetching: true,
                cancelSource,
            },
        });

        return store.dispatch(actions.getGroups())
            .then(() => {
                expect(cancelSource.cancel.calledOnce).toBe(true);
                expect(cancelSource.cancel.calledWith('Request is no longer valid, cancelling')).toBe(true);
                sourceStub.restore();
            });
    });

    it('getGroups should handle an axios cancel request', () => {
        const cancelSource = axios.CancelToken.source();
        const sourceStub = sinon.stub(axios.CancelToken, 'source')
            .returns(cancelSource);
        const cancelStub = sinon.stub(axios, 'isCancel').returns(true);
        const error = { message: 'cancelled request' };
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onGet('/api/groups').reply(400, error);

        const expectedActions = [
            { type: types.FETCHING_GROUPS, cancelSource },
        ];
        const store = mockStore({
            groups: {
                fetching: false,
                cancelSource: null,
            },
        });

        return store.dispatch(actions.getGroups())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                sourceStub.restore();
                cancelStub.restore();
            });
    });

    it('deleteGroup should handle delete request', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const groupId = '1234';

        mock.onDelete(`/api/groups/${groupId}`).reply(200);

        const expectedActions = [
            { type: types.DELETING_GROUP },
            { type: types.DELETED_GROUP },
        ];
        const store = mockStore({});

        return store.dispatch(actions.deleteGroup(groupId))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteGroup should handle request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const groupId = '12345';
        const error = 'oh no an error';

        mock.onDelete(`/api/groups/${groupId}`).reply(400, error);

        const expectedActions = [
            { type: types.DELETING_GROUP },
            { type: types.DELETE_GROUP_ERROR, error },
        ];
        const store = mockStore({});

        return store.dispatch(actions.deleteGroup(groupId))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('createGroup should handle create success', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        
        mock.onPost('/api/groups').reply(200);

        const expectedActions = [
            { type: types.CREATING_GROUP },
            { type: types.CREATED_GROUP },
        ];
        const store = mockStore({});

        return store.dispatch(actions.createGroup('Group name', []))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('createGroup should handle request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const error = 'oh no an error';

        mock.onPost('/api/groups').reply(400, error);

        const expectedActions = [
            { type: types.CREATING_GROUP },
            { type: types.CREATE_GROUP_ERROR, error },
        ];
        const store = mockStore({});

        return store.dispatch(actions.createGroup())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateGroup should handle success', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const group = { id: 1 };

        mock.onPatch(`/api/groups/${group.id}`).reply(200);

        const expectedActions = [
            { type: types.UPDATING_GROUP },
            { type: types.UPDATED_GROUP },
        ];
        const store = mockStore({});

        const options = {
            name: 'new name',
            members: ['member_one'],
            administrators: ['member_one'],
        };

        return store.dispatch(actions.updateGroup(group.id, options))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateGroup should handle request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const group = { id: 1, members: [] };
        const error = 'oh no an error';

        mock.onPatch(`/api/groups/${group.id}`).reply(400, error);

        const expectedActions = [
            { type: types.UPDATING_GROUP },
            { type: types.UPDATING_GROUP_ERROR, error },
        ];
        const store = mockStore({});

        return store.dispatch(actions.updateGroup(group.id))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
