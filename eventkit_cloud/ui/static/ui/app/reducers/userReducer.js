import actions from '../actions/actionTypes'

const initialState = {
  data: null,
  isLoading: false
}

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case actions.USER_LOGGING_IN:
      return { ...initialState, isLoading: true }
    case actions.USER_LOGGED_IN:
      return { data: payload, isLoading: false }
    case actions.USER_LOGGED_OUT:
      return initialState
    default:
      return state
  }
}