import React, {PropTypes} from 'react';
import FlatButton from 'material-ui/FlatButton';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';

export class DataPackFilterButton extends React.Component {

    constructor(props) {
        super(props);
    }
    
    render() {
        const styles = {
            button: {
                float: 'right',
                height: '30px',
                
                lineHeight: '30px',
                minWidth: 'none'
            },
            label: {
                color: '#4498c0', 
                textTransform: 'none', 
                padding: '0px',
                fontSize: '12px',
            },
            icon: {
                fill: '#4498c0',
                marginLeft: '0px'
            }
        };

        return (
            <FlatButton 
                style={styles.button}
                label={this.props.active ? "HIDE FILTERS" : "SHOW FILTERS"}
                labelPosition={"after"}
                labelStyle={styles.label}
                hoverColor={'#253447'}
                disableTouchRipple={true}
                onClick={this.props.handleToggle}
            >
            </FlatButton>
        );
    }
}


DataPackFilterButton.propTypes = {
    handleToggle: PropTypes.func.isRequired,
    active: PropTypes.bool.isRequired
};


export default DataPackFilterButton;
