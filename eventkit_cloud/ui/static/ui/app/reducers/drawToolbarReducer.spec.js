import * as reducers from './drawToolBarReducer'

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