import React, { PropTypes } from 'react'
import { bindActionCreators } from 'redux'

// Keeps track of action
// https://github.com/reactjs/redux/issues/297
export default (Form, submitAction) => {
  return React.createClass({
    contextTypes: {
      //redux Store
      store: PropTypes.object.isRequired
    },

    getInitialState () {
      return {}
    },

    onSubmit (...args) {
      const { context: { store: { dispatch } } } = this
      const { submitAction: submit }
        = bindActionCreators({ submitAction }, dispatch)
      submit(...args)
        .then(() => this.setState({ submitted: true }))
        .catch(error => this.setState({ error }))
    },

    render () {
      const {
        onSubmit,
        props,
        state: { submitted, error }
      } = this
      return (<Form {...props} onSubmit={onSubmit} submitted={submitted}
        error={error} />)
    }
  })
}