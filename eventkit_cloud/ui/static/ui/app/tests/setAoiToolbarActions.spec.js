import * as actions from '../actions/setAoiToolbarActions'

describe('setAoiToolbar actions', () => {

    it('toggleZoomToSelection should return boolean indicating if its disabled', () => {
        expect(actions.toggleZoomToSelection(true)).toEqual({
            type: 'TOGGLE_ZOOM_TO_SELECTION',
            disabled: true
        })
    })

    it('toggleResetMap should return a boolean indicating if its disabled', () => {
        expect(actions.toggleResetMap(true)).toEqual({
            type: 'TOGGLE_RESET_MAP',
            disabled: true
        })
    })

    it('clickZoomToSelection should return true', () => {
        expect(actions.clickZoomToSelection()).toEqual({
            type: 'CLICK_ZOOM_TO_SELECTION',
            click: true
        })
    })

    it('clickResetMap should return true', () => {
        expect(actions.clickResetMap()).toEqual({
            type: 'CLICK_RESET_MAP',
            click: true
        })
    })
})