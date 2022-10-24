import sinon from 'sinon';
import * as utils from '../../utils/generic';
import { getUsers } from "../../slices/usersSlice";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import * as TestUtils from "../test-utils";

describe('usersActions', () => {
    describe('getUsers action', () => {
        let mockAxios;
        const ret = { headers: { 'total-users': 12 }, data: ['user1', 'user2'] };
        beforeAll(() => {
            mockAxios = new MockAdapter(axios);
        });
        beforeEach(() => {
            mockAxios.onGet('/api/users').reply(200, ret.data, ret.headers);
        });
        afterEach(() => {
            mockAxios.reset();
        });
        it('onSuccess should return header info and users', async () => {
            const cookieStub = sinon.stub(utils, 'getCookie').returns('test');
            const headerStub = sinon.stub(utils, 'getHeaderPageInfo').returns({
                nextPage: false,
                range: '1-1',
            });
            const store = TestUtils.createTestStore(TestUtils.getDefaultTestState());
            const result: any = await store.dispatch(getUsers({}));
            expect(result.type).toBe(getUsers.fulfilled.type);
            expect(result.payload).toEqual({
                append: false,
                users: ret.data,
                total: ret.headers['total-users'],
                range: '1-1',
                nextPage: false,
            });
            cookieStub.restore();
            headerStub.restore();
        });
    });
});
