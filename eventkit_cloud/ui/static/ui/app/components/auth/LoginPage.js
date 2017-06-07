import React from 'react'
import LoginForm from '../../containers/loginContainer'
import Paper from 'material-ui/Paper'

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
    }

    componentWillMount() {
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    render() {
        const styles = {
            wholeDiv: {
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                marginBottom: '0px',
            },
            root: {
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: window.innerHeight - 95,
            },
            paper: {
                backgroundImage: "url('../../../images/topoBackground.jpg')",
                backgroundRepeat: 'repeat repeat',
                margin:  'auto',
                padding: '60px',
                width: '100%',
                maxWidth: '500px',
            }
        }

        return (
               <div style={styles.wholeDiv}>
                <div style={styles.root}>
                    <Paper style={styles.paper} zDepth={2}>
                        <LoginForm/>
                    </Paper>
                </div>
            </div>
        )
    }
}
export default LoginPage;