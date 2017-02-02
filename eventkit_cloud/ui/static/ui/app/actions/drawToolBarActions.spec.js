import * as actions from './drawToolBarActions'

describe('drawToolBar actions', () => {
    it('toggleDrawSet should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawSet(true)).toEqual({
            type: 'TOGGLE_DRAW_SET',
            disabled: true
        })
    })

    it('clickDrawSet should return true', () => {
        expect(actions.clickDrawSet()).toEqual({
            type: 'CLICK_DRAW_SET',
            click: true
        })
    })

    it('hideInvalidDrawWarning should return false', () => {
        expect(actions.hideInvalidDrawWarning()).toEqual({
            type: 'HIDE_INVALID_DRAW_WARNING',
            showInvalidDrawWarning: false
        })
    })

    it('showInvalidDrawWarning should return true', () => {
        expect(actions.showInvalidDrawWarning()).toEqual({
            type: 'SHOW_INVALID_DRAW_WARNING',
            showInvalidDrawWarning: true
        })
    })
})
