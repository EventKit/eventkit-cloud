import React from 'react';

// redirect to path if predicate returns true
// https://github.com/reactjs/redux/issues/297
export function redirect (path, predicate) {
  return Component =>
    class Composed extends React.Component {

      componentWillMount () {
        if (predicate(props))
          redirectTo(path)
      }

      componentWillReceiveProps (nextProps) {
        if (predicate(nextProps))
          redirectTo(path)
      }

      render () {
        return <Component {...this.props} />
      }
    }
}

//redirect to path if submitted
export function redirectSubmitted (path) {
  return redirect(path, ({ submitted }) => submitted)
}