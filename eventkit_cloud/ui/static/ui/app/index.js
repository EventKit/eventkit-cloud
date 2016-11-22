import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import App from './components/App'
import Application from './components/Application'
import reducer from './reducers'

const store = createStore(reducer)

render(
  <Provider store={store}>
    <Application />
  </Provider>,
  document.getElementById('root')
)
