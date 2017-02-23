import * as actions from '../actions/AoiInfobarActions'

describe('AoiInfobar actions', () => {
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