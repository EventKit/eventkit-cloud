import React from 'react'
import LoginForm from './LoginForm'
import styles from './Login.css'

class LoginPage extends React.Component {
    render() {
        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                <LoginForm/>
            </div></div>
        )
    }
}
export default LoginPage;