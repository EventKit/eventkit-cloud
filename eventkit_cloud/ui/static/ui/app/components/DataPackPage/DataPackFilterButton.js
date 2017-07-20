import React, {PropTypes} from 'react';
import FlatButton from 'material-ui/FlatButton';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';

export class DataPackFilterButton extends React.Component {

    constructor(props) {
        super(props);
    }

    getLabelFontSize() {
        if(window.innerWidth <= 575) {
            return '12px';
        }
        else if (window.innerWidth <= 767) {
            return '13px';
        }
        else if (window.innerWidth <= 991) {
            return '14px';
        }
        else if(window.innerWidth <= 1199) {
            return '15px';
        }
        else {
            return '16px';
        }
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
                fontSize: this.getLabelFontSize(),
            },
            icon: {
                fill: '#4498c0',
                marginLeft: '0px'
            }
        };

        return (
            <FlatButton 
                style={styles.button}
                label={"Filter"}
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
    handleToggle: PropTypes.func.isRequired
};


export default DataPackFilterButton;
