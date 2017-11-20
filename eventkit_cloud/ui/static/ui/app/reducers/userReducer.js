import types from '../actions/actionTypes'

export const initialState = {
  data: null,
  isLoading: false,
  patching: false,
  patched: false,
  error: null,
  autoLogoutAt: null,
  autoLogoutWarningAt: null,
}

export default (state = initialState, { type, payload, error }) => {
  switch (type) {
    case types.USER_LOGGING_IN:
      return { ...state, isLoading: true }
    case types.USER_LOGGED_IN:
      if(payload){
        return { ...state, data: payload, isLoading: false }
      } else {
        return {...state, data: null, isLoading: false}
      }
    case types.USER_LOGGED_OUT:
      return { ...state, data: null, isLoading: false}
    case types.PATCHING_USER:
      return { ...state, patching: true, patched: false}
    case types.PATCHED_USER:
      return { ...state, patching: false, patched: true, data: payload}
    case types.PATCHING_USER_ERROR:
      return { ...state, patching: false, error: error}
    case types.USER_ACTIVE:
      return { ...state, ...payload }
    default:
      return state
  }
}