import * as userActions from './userActions'
import actions from './actionTypes'
import MockAdapter from 'axios-mock-adapter'
import React from 'react'
import axios from 'axios'




describe('userActions actions', () => {

    it('logout should call logout reducer if logout request is successful', () => {
        const mock = new MockAdapter(axios);
        const logout = userActions.logout();
        expect(logout).toBeA('function');

        mock.onGet('/logout').reply(200);
        const dispatch = expect.createSpy();
        const getState = () => ({});
        logout(dispatch, getState).then(()=>{
            expect(dispatch).toHaveBeenCalledWith({
            type: actions.USER_LOGGED_OUT,
        });
        });

    })

})