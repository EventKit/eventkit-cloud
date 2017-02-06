import React from 'react'
import LoginForm from '../../containers/loginContainer'
import styles from './Login.css'
import redirect from '../../containers/redirect'
import login from '../../containers/login'

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