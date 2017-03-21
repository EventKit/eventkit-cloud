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
                fontSize: '15px',
                lineHeight: '30px',
                minWidth: 'none'
            },
            label: {
                color: '#4498c0', 
                textTransform: 'none', 
                padding: '0px'
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
                icon={
                this.props.open ? 
                    <NavigationArrowDropDown style={styles.icon}/> 
                :
                    <NavigationArrowDropUp style={styles.icon}/>
                }
                hoverColor={'#253447'}
                disableTouchRipple={true}
                onClick={this.props.handleToggle}
            >
            </FlatButton>
        );
    }
}


DataPackFilterButton.propTypes = {
    open: PropTypes.bool.isRequired,
    handleToggle: PropTypes.func.isRequired
};


export default DataPackFilterButton;
