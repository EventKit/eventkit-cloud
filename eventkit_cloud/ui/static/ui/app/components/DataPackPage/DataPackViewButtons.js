import React, {PropTypes} from 'react';
import ActionViewModule from 'material-ui/svg-icons/action/view-module';
import ActionViewStream from 'material-ui/svg-icons/action/view-stream';
import MapsMap from 'material-ui/svg-icons/maps/map';
import IconButton from 'material-ui/IconButton';

export class DataPackViewButtons extends React.Component {

    constructor(props) {
        super(props);
    }

    getDimension() {
        if(window.innerWidth <= 575) {
            return '21px';
        }
        else if (window.innerWidth <= 767) {
            return '22px';
        }
        else if (window.innerWidth <= 991) {
            return '23px';
        }
        else if(window.innerWidth <= 1199) {
            return '24px';
        }
        else {
            return '25px';
        }
    }

    render() {
        const dimension = this.getDimension();
        const styles = {
            button: {height: '35px', width: dimension, padding: '0px', float: 'right'},
            icon: {color: '#4498c0', height: dimension, width: dimension}
        }

        return (
            <div style={{paddingRight: '10px', display: 'inline-block', float: 'right'}}>
                <IconButton
                    onClick={() => {this.props.handleViewChange('grid')}}
                    style={styles.button}
                    iconStyle={styles.icon}
                >
                    <ActionViewModule />
                </IconButton>
                <IconButton
                    onClick={() => {this.props.handleViewChange('list')}}
                    style={styles.button}
                    iconStyle={styles.icon}
                >
                    <ActionViewStream />
                </IconButton>
                {window.innerWidth >= 768 ?
                    <IconButton
                        onClick={() => {this.props.handleViewChange('map')}}
                        style={styles.button}
                        iconStyle={styles.icon}
                    >
                        <MapsMap/>
                    </IconButton>
                :
                    null
                }
                
            </div> 
        );
    }
}


DataPackViewButtons.propTypes = {
    handleViewChange: React.PropTypes.func.isRequired,
};

export default DataPackViewButtons;
