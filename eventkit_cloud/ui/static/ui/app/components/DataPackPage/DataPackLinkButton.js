import React, {PropTypes} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router';

export class DataPackLinkButton extends React.Component {

    constructor(props) {
        super(props);
    }

    getFontSize() {
        if(window.innerWidth <= 575) {
            return '10px';
        }
        else if (window.innerWidth <= 767) {
            return '11px';
        }
        else if (window.innerWidth <= 991) {
            return '12px';
        }
        else if(window.innerWidth <= 1199) {
            return '13px';
        }
        else {
            return '14px';
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
                fontSize: this.getFontSize(),
                paddingLeft: '20px', 
                paddingRight: '20px', 
                lineHeight: '35px'
            },
        };

        return (
            <Link to={'/create'}>
                <RaisedButton
                    className={'qa-DataPackLinkButton-RaisedButton'}
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

export default DataPackLinkButton;
