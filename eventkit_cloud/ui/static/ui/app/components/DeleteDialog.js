import React, {PropTypes, Component} from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import BaseDialog from './BaseDialog';

export class DeleteDialog extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const deleteActions = [
            <RaisedButton
                style={{marginRight: '10px'}}
                labelStyle={{color: '#4598bf', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: 'whitesmoke'}}
                disableTouchRipple={true}
                label="Cancel"
                primary={false}
                onClick={this.props.handleCancel}
            />,
            <RaisedButton
                labelStyle={{color: 'red', fontWeight: 'bold'}}
                buttonStyle={{backgroundColor: 'whitesmoke'}}
                disableTouchRipple={true}
                label="Delete"
                primary={true}
                onClick={this.props.handleDelete}
            />,
        ];

        return (
            <BaseDialog
                show={this.props.show}
                title={'DELETE DATAPACK'}
                actions={deleteActions}
                onClose={this.props.handleCancel}
            >
                <strong>Are you sure you want to delete this DataPack?</strong>
            </BaseDialog>
        )
    }
}

DeleteDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    handleCancel: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,
};

export default DeleteDialog;
