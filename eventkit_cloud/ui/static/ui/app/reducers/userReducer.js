import types from '../actions/actionTypes'

const initialState = {
  data: null,
  isLoading: false,
  patching: false,
  patched: false,
  error: null,
}

export default (state = initialState, { type, payload, error }) => {
  switch (type) {
    case types.USER_LOGGING_IN:
      return { ...state, isLoading: true }
    case types.USER_LOGGED_IN:
      return { ...state, data: payload, isLoading: false }
    case types.USER_LOGGED_OUT:
      return { ...state, data: null, isLoading: false}
    case types.PATCHING_USER:
      return { ...state, patching: true, patched: false}
    case types.PATCHED_USER:
      return { ...state, patching: false, patched: true, data: payload}
    case types.PATCHING_USER_ERROR:
      return { ...state, error: error}
    default:
      return state
  }
}