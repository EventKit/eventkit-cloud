import * as reducers from '../reducers/drawToolBarReducer'

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