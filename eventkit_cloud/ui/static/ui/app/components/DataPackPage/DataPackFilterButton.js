import React, {PropTypes} from 'react';
import FlatButton from 'material-ui/FlatButton';
import NavigationArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import NavigationArrowDropUp from 'material-ui/svg-icons/navigation/arrow-drop-up';

export class DataPackFilterButton extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.state = {
            labelFontSize: '16px'
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
            this.setState({labelFontSize: '12px'});
        }
        else if (window.innerWidth <= 767) {
            this.setState({labelFontSize: '13px'});
        }
        else if (window.innerWidth <= 991) {
            this.setState({labelFontSize: '14px'});
        }
        else if(window.innerWidth <= 1199) {
            this.setState({labelFontSize: '15px'});
        }
        else {
            this.setState({labelFontSize: '16px'});
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
                fontSize: this.state.labelFontSize,
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
    open: PropTypes.bool.isRequired,
    handleToggle: PropTypes.func.isRequired
};


export default DataPackFilterButton;
