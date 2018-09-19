import * as reducers from '../../reducers/uiReducer';

describe('drawerMenu Reducer', () => {
    it('should return initial state', () => {
        expect(reducers.drawerMenuReducer(undefined, {})).toEqual('closed');
    });

    it('should handle OPENING_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'closed',
            { type: 'OPENING_DRAWER' },
        )).toEqual('opening');
    });

    it('should handle OPENED_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'opening',
            { type: 'OPENED_DRAWER' },
        )).toEqual('open');
    });

    it('should handle CLOSING_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'open',
            { type: 'CLOSING_DRAWER' },
        )).toEqual('closing');
    });

    it('should handle CLOSED_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'closing',
            { type: 'CLOSED_DRAWER' },
        )).toEqual('closed');
    });
});

describe('stepperReducer', () => {
    it('should return intial state', () => {
        expect(reducers.stepperReducer(undefined, {})).toEqual(false);
    });

    it('should handle MAKE_STEPPER_ACTIVE', () => {
        expect(reducers.stepperReducer(
            false,
            { type: 'MAKE_STEPPER_ACTIVE' },
        )).toEqual(true);
    });

    it('should handle MAKE_STEPPER_INACTIVE', () => {
        expect(reducers.stepperReducer(
            true,
            { type: 'MAKE_STEPPER_INACTIVE' },
        )).toEqual(false);
    });
});
