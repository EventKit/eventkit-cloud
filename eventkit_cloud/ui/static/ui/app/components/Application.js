import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {ClassificationBanner} from './ClassificationBanner'
import {Navigation} from './Navigation'
import styles from './Application.css'


class Application extends React.Component {
    render() {
        return (

            <div className={styles.root}>
                <ClassificationBanner />
                <Navigation />
                {this.props.children}
            </div>
        )
    }
}
Application.propTypes = {
    children: PropTypes.object.isRequired
};

export default Application
