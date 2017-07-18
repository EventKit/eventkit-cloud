import * as reducers from '../../reducers/AoiInfobarReducer'

describe('zoomToSelectionReducer', () => {
    it('should return initial state', () => {
        expect(reducers.zoomToSelectionReducer(undefined, {})).toEqual(
            {
                click: false
            }
        )
    })

    it('should handle CLICK_ZOOM_TO_SELECTION', () => {
        expect(reducers.zoomToSelectionReducer(
            {
                click: false
            },
            {
                type: 'CLICK_ZOOM_TO_SELECTION'
            }
        )).toEqual({click: true})
    })
})

describe('resetMapReducer', () => {
    it('should return initial state', () => {
        expect(reducers.resetMapReducer(undefined, {})).toEqual(
            {
                click: false
            }
        )
    })

    it('should handle CLICK_RESET_MAP', () => {
        expect(reducers.resetMapReducer(
            {
                click: false
            },
            {
                type: 'CLICK_RESET_MAP'
            }
        )).toEqual({click: true})
    })
})
