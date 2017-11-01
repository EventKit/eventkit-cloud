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
                lineHeight: '15px',
                minWidth: 'none',
                width: window.innerWidth > 575 ? '90px' : '40px'
            },
            label: {
                color: '#4498c0', 
                textTransform: 'none', 
                padding: '0px',
                fontSize: window.innerWidth > 575 ? '12px' : '10px',
            },
            icon: {
                fill: '#4498c0',
                marginLeft: '0px'
            }
        };

        return (
            <FlatButton
                className={'qa-DataPackFilterButton-FlatButton'}
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
