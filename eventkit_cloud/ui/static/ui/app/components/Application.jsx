import React, {Component} from 'react'
import {connect} from 'react-redux'
import {ClassificationBanner} from './ClassificationBanner'
//import styles from './Application.css'

const Application = () => (
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0
  }} >
        <ClassificationBanner />
    </div>
)

export default Application
