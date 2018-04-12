import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router';

export class DataPackLinkButton extends React.Component {
    render() {
        const styles = {
            button: {
                margin: '0px',
                minWidth: '50px',
                height: '35px',
                borderRadius: '0px',
                width: '150px',
            },
            label: {
                fontSize: '12px',
                paddingLeft: '0px',
                paddingRight: '0px',
                lineHeight: '35px',
            },
        };

        return (
            <Link to="/create" href="/create">
                <RaisedButton
                    className="qa-DataPackLinkButton-RaisedButton"
                    label="Create DataPack"
                    primary
                    labelStyle={styles.label}
                    style={styles.button}
                    buttonStyle={{ borderRadius: '0px', backgroundColor: '#4598bf' }}
                    overlayStyle={{ borderRadius: '0px' }}
                />
            </Link>
        );
    }
}

export default DataPackLinkButton;
