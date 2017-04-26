import React, {PropTypes} from 'react';
import ActionViewModule from 'material-ui/svg-icons/action/view-module';
import ActionViewStream from 'material-ui/svg-icons/action/view-stream';
import IconButton from 'material-ui/IconButton';

export class DataPackViewButtons extends React.Component {

    constructor(props) {
        super(props);
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
        this.state = {
            dimension: '24px'
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
            this.setState({dimension: '21px'});
        }
        else if (window.innerWidth <= 767) {
            this.setState({dimension: '22px'});
        }
        else if (window.innerWidth <= 991) {
            this.setState({dimension: '23px'});
        }
        else if(window.innerWidth <= 1199) {
            this.setState({dimension: '24px'});
        }
        else {
            this.setState({dimension: '25px'});
        }
    }

    render() {
        const styles = {
            button: {height: '35px', width: this.state.dimension, padding: '0px', float: 'right'},
            icon: {color: '#4498c0', height: this.state.dimension, width: this.state.dimension}
        }

        return (
            <div style={{paddingRight: '10px', display: 'inline-block', float: 'right'}}>
                <IconButton
                    onClick={this.props.handleGridSelect}
                    style={styles.button}
                    iconStyle={styles.icon}
                >
                    <ActionViewModule />
                </IconButton>
                <IconButton
                    onClick={this.props.handleListSelect}
                    style={styles.button}
                    iconStyle={styles.icon}
                >
                    <ActionViewStream />
                </IconButton>
            </div> 
        );
    }
}


DataPackViewButtons.propTypes = {
    handleGridSelect: React.PropTypes.func.isRequired,
    handleListSelect: React.PropTypes.func.isRequired,
};

export default DataPackViewButtons;
