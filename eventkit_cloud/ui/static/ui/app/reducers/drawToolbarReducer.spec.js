import * as reducers from './drawToolBarReducer'

describe('drawExtension reducer', () => {
    it('should return the initial state', () => {
        expect(
            reducers.drawExtensionReducer(undefined, {})).toEqual(false)
    })

    it('should handle TOGGLE_DRAW_EXTENSION', () => {
        expect(
            reducers.drawExtensionReducer(
                false, {type: 'TOGGLE_DRAW_EXTENSION', drawExtensionVisible: true}
            )
        ).toEqual(true)
    })
})

describe('drawCancel reducer', () => {
    it('should return the initial state', () => {
        expect(
        reducers.drawCancelReducer(undefined, {})
        ).toEqual({
            disabled: true,
            click: false
        })
    })

    it('should handle TOGGLE_DRAW_CANCEL', () => {
        expect(
            reducers.drawCancelReducer(
                {
                    disabled: true,
                    click: false,
                },
                {
                    type: 'TOGGLE_DRAW_CANCEL',
                    disabled: false
                }
            )
        ).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_DRAW_CANCEL', () => {
        expect(
            reducers.drawCancelReducer(
                {
                    disabled: true,
                    click: false
                },
                {
                    type: 'CLICK_DRAW_CANCEL',
                    click: true,
                }
            )
        ).toEqual({disabled: true, click: true})
    })
})

describe('drawRedraw reducer', () => {
    it('should return the initial state', () => {
        expect(
        reducers.drawRedrawReducer(undefined, {})
        ).toEqual({
            disabled: true,
            click: false
        })
    })

    it('should handle TOGGLE_DRAW_REDRAW', () => {
        expect(
            reducers.drawRedrawReducer(
                {
                    disabled: true,
                    click: false,
                },
                {
                    type: 'TOGGLE_DRAW_REDRAW',
                    disabled: false
                }
            )
        ).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_DRAW_REDRAW', () => {
        expect(
            reducers.drawRedrawReducer(
                {
                    disabled: true,
                    click: false
                },
                {
                    type: 'CLICK_DRAW_REDRAW',
                    click: true,
                }
            )
        ).toEqual({disabled: true, click: true})
    })
})

describe('drawSet reducer', () => {
    it('should return the initial state', () => {
        expect(
        reducers.drawSetReducer(undefined, {})
        ).toEqual({
            disabled: true,
            click: false
        })
    })

    it('should handle TOGGLE_DRAW_SET', () => {
        expect(
            reducers.drawSetReducer(
                {
                    disabled: true,
                    click: false,
                },
                {
                    type: 'TOGGLE_DRAW_SET',
                    disabled: false
                }
            )
        ).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_DRAW_SET', () => {
        expect(
            reducers.drawSetReducer(
                {
                    disabled: true,
                    click: false
                },
                {
                    type: 'CLICK_DRAW_SET',
                    click: true,
                }
            )
        ).toEqual({disabled: true, click: true})
    })
})

describe('drawBoxButton reducer', () => {
    it('should return the initial state', () => {
        expect(
        reducers.drawBoxButtonReducer(undefined, {})
        ).toEqual({
            disabled: true,
            click: false
        })
    })

    it('should handle TOGGLE_DRAW_BOX_BUTTON', () => {
        expect(
            reducers.drawBoxButtonReducer(
                {
                    disabled: true,
                    click: false,
                },
                {
                    type: 'TOGGLE_DRAW_BOX_BUTTON',
                    disabled: false
                }
            )
        ).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_DRAW_BOX_BUTTON', () => {
        expect(
            reducers.drawBoxButtonReducer(
                {
                    disabled: true,
                    click: false
                },
                {
                    type: 'CLICK_DRAW_BOX_BUTTON',
                    click: true,
                }
            )
        ).toEqual({disabled: true, click: true})
    })
})

describe('drawFreeButton reducer', () => {
    it('should return the initial state', () => {
        expect(
        reducers.drawFreeButtonReducer(undefined, {})
        ).toEqual({
            disabled: true,
            click: false
        })
    })

    it('should handle TOGGLE_DRAW_FREE_BUTTON', () => {
        expect(
            reducers.drawFreeButtonReducer(
                {
                    disabled: true,
                    click: false,
                },
                {
                    type: 'TOGGLE_DRAW_FREE_BUTTON',
                    disabled: false
                }
            )
        ).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_DRAW_FREE_BUTTON', () => {
        expect(
            reducers.drawFreeButtonReducer(
                {
                    disabled: true,
                    click: false
                },
                {
                    type: 'CLICK_DRAW_FREE_BUTTON',
                    click: true,
                }
            )
        ).toEqual({disabled: true, click: true})
    })
})

describe('invalidDrawWarning reducer', () => {
    it('should return the initial state', () => {
        expect(reducers.invalidDrawWarningReducer(undefined, {})).toEqual(false)
    })

    it('should handle SHOW_INVALID_DRAW_WARNING', () => {
        expect(reducers.invalidDrawWarningReducer(
            false,
            {type: 'SHOW_INVALID_DRAW_WARNING', showInvalidDrawWarning: true}
        )).toEqual(true)
    })

    it('should handle HIDE_INVALID_DRAW_WARNING', () => {
        expect(reducers.invalidDrawWarningReducer(
            true,
            {type: 'HIDE_INVALID_DRAW_WARNING', showInvalidDrawWarning: false}
        )).toEqual(false)
    })
})