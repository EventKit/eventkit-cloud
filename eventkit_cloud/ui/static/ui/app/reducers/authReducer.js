import actions from '../actions/actionTypes'

export default (state = {}, action) => {
  switch(action.type){
    // saves the token into the state
    case actions.AUTH_SET_TOKEN:
      return {
        ...state,
        token: action.token
      };
    // discards the current token (logout)
    case actions.AUTH_DISCARD_TOKEN:
      return {};
    // saves the current user
    case actions.AUTH_SET_USER:
      return {
        ...state,
        user
      };
    // as always, on default do nothing
    default:
      return state;
  }
}