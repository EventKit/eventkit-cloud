import React, {PropTypes} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router';

export class DataPackLinkButton extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.state = {
            fontSize: '14px'
        }
    }

    componentWillMount() {
        this.screenSizeUpdate();
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        if(window.innerWidth <= 575) {
            this.setState({fontSize: '10px'});
        }
        else if (window.innerWidth <= 767) {
            this.setState({fontSize: '11px'});
        }
        else if (window.innerWidth <= 991) {
            this.setState({fontSize: '12px'});
        }
        else if(window.innerWidth <= 1199) {
            this.setState({fontSize: '13px'});
        }
        else {
            this.setState({fontSize: '14px'});
        }
    }

    render() {
        const styles = {
            button: {
                margin: '0px', 
                minWidth: '50px', 
                height: '35px', 
                borderRadius: '0px'
            },
            label: {
                fontSize: this.state.fontSize,
                paddingLeft: '20px', 
                paddingRight: '20px', 
                lineHeight: '35px'
            },
        };

        return (
            <Link to={'/create'}>
                <RaisedButton 
                    label={"Create DataPack"}
                    primary={true}
                    labelStyle={styles.label}
                    style={styles.button}
                    buttonStyle={{borderRadius: '0px', backgroundColor: '#4598bf'}}
                    overlayStyle={{borderRadius: '0px'}}
                />
            </Link>
        );
    }
}

DataPackLinkButton.propTypes = {
    
};

export default DataPackLinkButton;
