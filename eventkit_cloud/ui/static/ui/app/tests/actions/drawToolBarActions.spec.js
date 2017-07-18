import * as actions from '../../actions/drawToolBarActions'

describe('drawToolBar actions', () => {

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
