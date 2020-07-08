import { types } from '../actions/uiActions';

export const initialState = {
    drawer: 'closed',
    stepperNextEnabled: false,
};

export function drawerMenuReducer(state = initialState.drawer, action) {
    switch (action.type) {
        case types.OPENING_DRAWER:
            return 'opening';
        case types.OPENED_DRAWER:
            return 'open';
        case types.CLOSING_DRAWER:
            return 'closing';
        case types.CLOSED_DRAWER:
            return 'closed';
        default:
            return state;
    }
}

export function stepperReducer(state = initialState.stepperNextEnabled, action) {
    switch (action.type) {
        case types.MAKE_STEPPER_ACTIVE:
            return true;
        case types.MAKE_STEPPER_INACTIVE:
            return false;
        default:
            return state;
    }
}
