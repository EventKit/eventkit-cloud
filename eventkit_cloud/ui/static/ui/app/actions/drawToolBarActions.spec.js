import * as actions from './drawToolBarActions'

describe('drawToolBar actions', () => {
    it('toggleDrawExtension should return the specifed visibility boolean', () => {
        expect(actions.toggleDrawExtension(true)).toEqual({
            type: 'TOGGLE_DRAW_EXTENSION',
            drawExtensionVisible: true
        })
    })

    it('toggleDrawCancel should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawCancel(true)).toEqual({
            type: 'TOGGLE_DRAW_CANCEL',
            disabled: true
        })
    })

    it('toggleDrawRedraw should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawRedraw(true)).toEqual({
            type: 'TOGGLE_DRAW_REDRAW',
            disabled: true
        })
    })

    it('toggleDrawSet should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawSet(true)).toEqual({
            type: 'TOGGLE_DRAW_SET',
            disabled: true
        })
    })

    it('toggleDrawBoxButton should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawBoxButton(true)).toEqual({
            type: 'TOGGLE_DRAW_BOX_BUTTON',
            disabled: true
        })
    })

    it('toggleDrawFreeButton should return a boolean indicating if its disabled', () => {
        expect(actions.toggleDrawFreeButton(true)).toEqual({
            type: 'TOGGLE_DRAW_FREE_BUTTON',
            disabled: true
        })
    })

    it('clickDrawCancel should return true', () => {
        expect(actions.clickDrawCancel()).toEqual({
            type: 'CLICK_DRAW_CANCEL',
            click: true
        })
    })

    it('clickDrawRedraw should return true', () => {
        expect(actions.clickDrawRedraw()).toEqual({
            type: 'CLICK_DRAW_REDRAW',
            click: true
        })
    })

    it('clickDrawSet should return true', () => {
        expect(actions.clickDrawSet()).toEqual({
            type: 'CLICK_DRAW_SET',
            click: true
        })
    })

    it('clickDrawBoxButton should return true', () => {
        expect(actions.clickDrawBoxButton()).toEqual({
            type: 'CLICK_DRAW_BOX_BUTTON',
            click: true
        })
    })

    it('clickDrawFreeButton should return true', () => {
        expect(actions.clickDrawFreeButton()).toEqual({
            type: 'CLICK_DRAW_FREE_BUTTON',
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
