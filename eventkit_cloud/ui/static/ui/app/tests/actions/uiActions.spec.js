import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import * as actions from '../../actions/uiActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('ui actions', () => {
    it('setPageOrder should return type SET_PAGE_ORDER and the order', () => {
        const order = 'featured';
        expect(actions.setPageOrder(order)).toEqual({
            type: actions.types.SET_PAGE_ORDER,
            order,
        });
    });

    it('setPageView should return type SET_PAGE_VIEW and the view', () => {
        const view = 'map';
        expect(actions.setPageView(view)).toEqual({
            type: actions.types.SET_PAGE_VIEW,
            view,
        });
    });

    it('stepperNextDisabled should return MAKE_STEPPER_INACTIVE and false', () => {
        expect(actions.stepperNextDisabled()).toEqual({
            type: 'MAKE_STEPPER_INACTIVE',
            stepperNextEnabled: false,
        });
    });

    it('stepperNextEnabled should return MAKE_STEPPER_ACTIVE and true', () => {
        expect(actions.stepperNextEnabled()).toEqual({
            type: 'MAKE_STEPPER_ACTIVE',
            stepperNextEnabled: true,
        });
    });

    it('DrawerTimeout closeDrawer should close drawer', () => {
        const timeout = new actions.DrawerTimeout();
        const expectedActions = [
            { type: actions.types.CLOSING_DRAWER },
            { type: actions.types.CLOSED_DRAWER },
        ];

        const store = mockStore({ drawer: 'open' });
        return store.dispatch(timeout.closeDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('DrawerTimeout closeDrawer should close drawer and clear open timeout', () => {
        const clearStub = sinon.stub(global, 'clearTimeout');
        const timeout = new actions.DrawerTimeout(null, 'yo');
        const expectedActions = [
            { type: actions.types.CLOSING_DRAWER },
            { type: actions.types.CLOSED_DRAWER },
        ];

        const store = mockStore({ drawer: 'open' });
        return store.dispatch(timeout.closeDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });

    it('DrawerTimeout openDrawer should open drawer', () => {
        const timeout = new actions.DrawerTimeout();
        const expectedActions = [
            { type: actions.types.OPENING_DRAWER },
            { type: actions.types.OPENED_DRAWER },
        ];

        const store = mockStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('DrawerTimeout openDrawer should open drawer and clear open timeout', () => {
        const clearStub = sinon.stub(global, 'clearTimeout');
        const timeout = new actions.DrawerTimeout('yo', null);
        const expectedActions = [
            { type: actions.types.OPENING_DRAWER },
            { type: actions.types.OPENED_DRAWER },
        ];

        const store = mockStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });
});

