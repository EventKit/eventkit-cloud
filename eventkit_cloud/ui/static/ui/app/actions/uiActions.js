export const types = {
    CLOSED_DRAWER: 'CLOSED_DRAWER',
    CLOSING_DRAWER: 'CLOSING_DRAWER',
    MAKE_STEPPER_ACTIVE: 'MAKE_STEPPER_ACTIVE',
    MAKE_STEPPER_INACTIVE: 'MAKE_STEPPER_INACTIVE',
    OPENED_DRAWER: 'OPENED_DRAWER',
    OPENING_DRAWER: 'OPENING_DRAWER',
    RESET_STATE: 'RESET_APPLICATION_STATE',
    SET_PAGE_ORDER: 'SET_PAGE_ORDER',
    SET_PAGE_VIEW: 'SET_PAGE_VIEW',
};

export function resetState() {
    return {
        type: types.RESET_STATE,
    };
}

export function stepperNextDisabled() {
    return {
        stepperNextEnabled: false,
        type: types.MAKE_STEPPER_INACTIVE,
    };
}

export function stepperNextEnabled() {
    return {
        stepperNextEnabled: true,
        type: types.MAKE_STEPPER_ACTIVE,
    };
}

export function setPageOrder(order) {
    return {
        order,
        type: types.SET_PAGE_ORDER,
    };
}

export function setPageView(view) {
    return {
        type: types.SET_PAGE_VIEW,
        view,
    };
}

// This is probably not the correct way to cancel async actions... but it works.
// We are using a class so that this works in the running application and is test-able
export class DrawerTimeout {
    constructor(closeDrawerTimeout, openDrawerTimeout) {
        this.closeDrawerTimeout = closeDrawerTimeout || null;
        this.openDrawerTimeout = openDrawerTimeout || null;
    }

    closeDrawer() {
        return (dispatch) => {
            if (this.openDrawerTimeout !== null) {
                clearTimeout(this.openDrawerTimeout);
                this.openDrawerTimeout = null;
            }

            dispatch({
                type: types.CLOSING_DRAWER,
            });

            return new Promise((resolve) => {
                this.closeDrawerTimeout = setTimeout(() => {
                    this.closeDrawerTimeout = null;
                    dispatch({
                        type: types.CLOSED_DRAWER,
                    });
                    resolve();
                }, 450);
            });
        };
    }

    openDrawer() {
        return (dispatch) => {
            if (this.closeDrawerTimeout !== null) {
                clearTimeout(this.closeDrawerTimeout);
                this.closeDrawerTimeout = null;
            }

            dispatch({
                type: types.OPENING_DRAWER,
            });

            return new Promise((resolve) => {
                this.openDrawerTimeout = setTimeout(() => {
                    this.openDrawerTimeout = null;
                    dispatch({
                        type: types.OPENED_DRAWER,
                    });
                    resolve();
                }, 450);
            });
        };
    }
}
