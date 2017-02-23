import * as reducers from '../reducers/AoiInfobarReducer'

describe('zoomToSelectionReducer', () => {
    it('should return initial state', () => {
        expect(reducers.zoomToSelectionReducer(undefined, {})).toEqual(
            {disabled: true,
                click: false
            }
        )
    })

    it('should handle TOGGLE_ZOOM_TO_SELECTION', () => {
        expect(reducers.zoomToSelectionReducer(
            {disabled: true,
                click: false
            },
            {
                type: 'TOGGLE_ZOOM_TO_SELECTION',
                disabled: false
            }
        )).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_ZOOM_TO_SELECTION', () => {
        expect(reducers.zoomToSelectionReducer(
            {
                disabled: false,
                click: false
            },
            {
                type: 'CLICK_ZOOM_TO_SELECTION'
            }
        )).toEqual({disabled: false, click: true})
    })
})

describe('resetMapReducer', () => {
    it('should return initial state', () => {
        expect(reducers.resetMapReducer(undefined, {})).toEqual(
            {disabled: true,
                click: false
            }
        )
    })

    it('should handle TOGGLE_RESET_MAP', () => {
        expect(reducers.resetMapReducer(
            {disabled: true,
                click: false
            },
            {
                type: 'TOGGLE_RESET_MAP',
                disabled: false
            }
        )).toEqual({disabled: false, click: false})
    })

    it('should handle CLICK_RESET_MAP', () => {
        expect(reducers.resetMapReducer(
            {
                disabled: false,
                click: false
            },
            {
                type: 'CLICK_RESET_MAP'
            }
        )).toEqual({disabled: false, click: true})
    })
})
