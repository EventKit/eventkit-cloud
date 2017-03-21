import React, {PropTypes} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router';

export class DataPackLinkButton extends React.Component {

    constructor(props) {
        super(props);
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
                fontSize: this.props.fontSize,
                paddingLeft: '30px', 
                paddingRight: '30px', 
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
                    buttonStyle={{borderRadius: '0px'}}
                    overlayStyle={{borderRadius: '0px'}}
                />
            </Link>
        );
    }
}

DataPackLinkButton.propTypes = {
    fontSize: PropTypes.string.isRequired
};

export default DataPackLinkButton;
