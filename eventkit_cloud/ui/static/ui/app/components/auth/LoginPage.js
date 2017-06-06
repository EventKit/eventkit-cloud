import React from 'react';
import axios from 'axios';
import LoginForm from '../../containers/loginContainer';
import Paper from 'material-ui/Paper';
import CustomScrollbar from '../CustomScrollbar';

class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.getDisclaimer = this.getDisclaimer.bind(this);
        this.state = {
            disclaimer: "",
        }
    }

    componentDidMount() {
        this.getDisclaimer();
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

    getDisclaimer() {
        return axios.get('/disclaimer')
        .then((response) => {
            if(response.data) {
                this.setState({disclaimer: response.data});
            }
        }).catch((error) => {
        });
    }

    render() {
        const paperWidth = window.innerWidth / 2 - 20 < 600 ? window.innerWidth / 2 - 20 : 600;

        const styles = {
            wholeDiv: {
                width: '100%',
                height: window.innerHeight - 95,
                backgroundColor: 'black',
            },
            root: {
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                
            },
            paper: {
                display: 'inline-block',
                backgroundImage: "url('../../../images/topoBackground.jpg')",
                backgroundRepeat: 'repeat repeat',
                padding: '30px',
                maxHeight: 400,
                width: '100%',
                overflow: 'hidden'
            },
            container: {width: '50%', margin: '0px auto', maxWidth: '600px', display: 'inline-block', padding: '15px', minWidth: '350px'}
        }

        return (
               <div style={styles.wholeDiv}>
                <div style={{margin: '0px auto', maxWidth: 1200, height: window.innerHeight - 95}}>
                
                <div style={styles.container}>
                    <Paper style={styles.paper} zDepth={2}>
                        <LoginForm/>
                    </Paper>
                </div>

                <div style={styles.container}>
                    <Paper style={styles.paper} zDepth={2}>
                        {this.state.disclaimer ? <div dangerouslySetInnerHTML={{__html: this.state.disclaimer}}/>: null}
                    </Paper>
                </div>

                </div>
            </div>
        )
    }
}
export default LoginPage;