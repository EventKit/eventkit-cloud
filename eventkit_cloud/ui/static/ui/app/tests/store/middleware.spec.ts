import axios from 'axios';
import * as MockAdapter from 'axios-mock-adapter';
import * as sinon from 'sinon';
import * as middleware from '../../store/middlewares';

describe('middleware', () => {
    describe('crashReporter', () => {
        const error = new Error('test error');
        it('should succeed', () => {
            const next = sinon.stub();
            const action = { type: 'test action' };
            expect(() => middleware.crashReporter()(next)(action)).not.toThrow(error);
        });

        it('should catch and throw error', () => {
            const next = sinon.stub().throws(error);
            const action = { type: 'test action' };
            expect(() => middleware.crashReporter()(next)(action)).toThrow(error);
        });
    });

    describe('simpleApiCall', () => {
        let next;
        let dispatch;
        let getState;

        beforeEach(() => {
            next = sinon.stub();
            dispatch = sinon.stub();
            getState = sinon.stub();
        });

        it('should pass on batch actions', () => {
            const actions = [{ type: 'one' }, { type: 'two' }];
            middleware.simpleApiCall({ dispatch, getState})(next)(actions);
            expect(next.calledOnce).toBe(true);
            expect(next.calledWith(actions)).toBe(true);
        });

        it('should pass on simple actions', () => {
            const action = { type: 'some action' };
            middleware.simpleApiCall({ dispatch, getState })(next)(action);
            expect(next.calledOnce).toBe(true);
            expect(next.calledWith(action)).toBe(true);
        });

        it('should throw error if types is not 3 values', () => {
            const action = {
                types: ['one', 'two'],
            };
            expect(() => middleware.simpleApiCall({dispatch, getState})(next)(action))
                .toThrow('Expected an array of three string types.');
        });

        it('should throw an error if all types are not strings', () => {
            const action = {
                types: ['one', 'two', { type: 'three' }],
            };
            expect(() => middleware.simpleApiCall({dispatch, getState})(next)(action))
                .toThrow('Expected an array of three string types.');
        });

        it('should throw an error if auth required but not found', () => {
            getState.returns({ user: { data: null } });
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: true,
            };
            expect(() => middleware.simpleApiCall({dispatch, getState})(next)(action))
                .toThrow('Authentication is required for this action');
        });

        it('should return nothing if shouldCallApi returns false', () => {
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => false,
                getCancelSource: sinon.stub(),
            };
            const ret = middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(ret).toBe(undefined);
            expect(action.getCancelSource.called).toBe(false);
        });

        it('should cancel on-going request if source is returned and not auto', () => {
            const cancel = sinon.stub();
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => ({ cancel }),
                auto: false,
            };
            middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(action.getCancelSource().cancel.calledOnce).toBe(true);
        });

        it('should create a cancelSource and dispatch it with the first type', () => {
            const source = { token: '123', cancel: sinon.stub() };
            const getSource = sinon.stub(axios.CancelToken, 'source').returns(source);
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => undefined,
                auto: false,
                cancellable: true,
            };
            middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledOnce).toBe(true);
            expect(dispatch.calledWith({
                cancelSource: source,
                type: action.types[0],
            }));
            getSource.restore();
        });

        it('should make the proper axios request and then dispatch with onSuccess value', async () => {
            const mock = new MockAdapter(axios, { delayResponse: 0 });
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => undefined,
                onSuccess: () => ({ data: 'some data' }),
                auto: false,
                cancellable: false,
                method: 'GET',
                url: '/fake/url',
            };
            mock.onGet('/fake/url').reply(200);
            await middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledTwice).toBe(true);
            expect(dispatch.calledWith({ type: action.types[1], data: 'some data' })).toBe(true);
        });

        it('should make the proper axios request and then dispatch with onSuccess AND batchSuccess values', async () => {
            const mock = new MockAdapter(axios, { delayResponse: 0 });
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => undefined,
                onSuccess: () => ({ data: 'some data' }),
                batchSuccess: () => ([{type: 'some batch type' }]),
                auto: false,
                cancellable: false,
                method: 'GET',
                url: '/fake/url',
            };
            mock.onGet('/fake/url').reply(200);
            await middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledTwice).toBe(true);
            expect(dispatch.calledWith([
                { type: action.types[1], data: 'some data' },
                { type: 'some batch type' },
            ])).toBe(true);
        });

        it('should make the proper axios request and then handle axios cancel', async () => {
            const isCancelStub = sinon.stub(axios, 'isCancel').returns(true);
            const mock = new MockAdapter(axios, { delayResponse: 0 });
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => undefined,
                onSuccess: () => ({ data: 'some data' }),
                batchSuccess: () => ([{type: 'some batch type' }]),
                auto: false,
                cancellable: false,
                method: 'GET',
                url: '/fake/url',
            };
            mock.onGet('/fake/url').reply(500);
            await middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledOnce).toBe(true);
            expect(isCancelStub.calledOnce).toBe(true);
            isCancelStub.restore();
        });

        it('should make the proper axios request and then dispatch onError value', async () => {
            const isCancelStub = sinon.stub(axios, 'isCancel').returns(false);
            const mock = new MockAdapter(axios, { delayResponse: 0 });
            const action = {
                types: ['one', 'two', 'three'],
                requiresAuth: false,
                shouldCallApi: () => true,
                getCancelSource: () => undefined,
                onSuccess: () => ({ data: 'some data' }),
                batchSuccess: () => ([{type: 'some batch type' }]),
                onError: sinon.stub().returns({ error: 'test error' }),
                auto: false,
                cancellable: false,
                method: 'GET',
                url: '/fake/url',
            };
            mock.onGet('/fake/url').reply(500);
            await middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledTwice).toBe(true);
            expect(isCancelStub.calledOnce).toBe(true);
            expect(dispatch.calledWith({ type: action.types[2], error: 'test error' })).toBe(true);
            isCancelStub.restore();
        });

        it('should call all the default arg functions', async () => {
            const mock = new MockAdapter(axios, { delayResponse: 0 });
            const action = {
                types: ['one', 'two', 'three'],
                method: 'GET',
                requiresAuth: false,
                url: '/fake/url',
            };
            mock.onGet('/fake/url').reply(200, { data: 'some data' });
            await middleware.simpleApiCall({dispatch, getState})(next)(action);
            expect(dispatch.calledTwice).toBe(true);
        });
    });
});
