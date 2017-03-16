import types from '../actions/actionTypes'

const initialState = {
  csrftoken: null
}

export default (state = initialState, { type, payload }) => {

  switch (type) {
      case types.SET_CSRF:
      return { ...state, ...payload }
    case types.CLEAR_CSRF:
      return { ...state, csrftoken: null }
    default:
      return state
  }
}