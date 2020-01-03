import sinon from 'sinon';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/uiActions';

describe('ui actions', () => {
    it('setPageOrder should return type SET_PAGE_ORDER and the order', () => {
        const order = 'featured';
        expect(actions.setPageOrder(order)).toEqual({
            order,
            type: actions.types.SET_PAGE_ORDER,
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
            stepperNextEnabled: false,
            type: 'MAKE_STEPPER_INACTIVE',
        });
    });

    it('stepperNextEnabled should return MAKE_STEPPER_ACTIVE and true', () => {
        expect(actions.stepperNextEnabled()).toEqual({
            stepperNextEnabled: true,
            type: 'MAKE_STEPPER_ACTIVE',
        });
    });

    it('DrawerTimeout closeDrawer should close drawer', () => {
        const timeout = new actions.DrawerTimeout();
        const expectedActions = [
            { type: actions.types.CLOSING_DRAWER },
            { type: actions.types.CLOSED_DRAWER },
        ];

        const store = createTestStore({ drawer: 'open' });
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

        const store = createTestStore({ drawer: 'open' });
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

        const store = createTestStore({ drawer: 'closed' });
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

        const store = createTestStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });
});
