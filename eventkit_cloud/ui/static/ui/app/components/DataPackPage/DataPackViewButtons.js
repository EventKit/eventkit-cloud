import React, {PropTypes} from 'react';
import ActionViewModule from 'material-ui/svg-icons/action/view-module';
import ActionViewStream from 'material-ui/svg-icons/action/view-stream';
import IconButton from 'material-ui/IconButton';

export class DataPackViewButtons extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const styles = {
            button: {height: '35px', width: '30px', padding: '0px', float: 'right'},
            icon: {color: '#4498c0'}
        }

        return (
            <div>
                <IconButton
                    tooltip={"Grid View"}
                    onClick={this.props.handleGridSelect}
                    style={styles.button}
                    iconStyle={styles.icon}
                >
                    <ActionViewModule />
                </IconButton>
                <IconButton
                    tooltip={"List View"}
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
