import React, { PropTypes, Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import Clear from 'material-ui/svg-icons/content/clear';
import CustomScrollbar from './CustomScrollbar';

export class BaseDialog extends Component {
    render() {
        // default styling with the option for overriding with custom props
        const styles = {
            dialog: {
                width: '70%',
                minWidth: '300px',
                maxWidth: '610px',
                maxHeight: '90%',
                ...this.props.dialogStyle,
            },
            title: {
                padding: '25px',
                fontWeight: 'none',
                fontSize: '18px',
                color: 'grey',
                ...this.props.titleStyle,
            },
            body: {
                padding: '0px 25px',
                ...this.props.bodyStyle,
            },
            actions: {
                padding: '25px',
                ...this.props.actionsStyle,
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
            label: {
                color: 'whitesmoke',
                fontWeight: 'bold',
                ...this.props.labelStyle,
            },
            button: {
                backgroundColor: '#4598bf',
                borderRadius: '0px',
                ...this.props.buttonStyle,
            },
        };

        // the default is just a close button
        const defaultActions = [
            <RaisedButton
                className="qa-BaseDialog-RasiedButton"
                style={{ margin: '0px' }}
                labelStyle={styles.label}
                buttonStyle={styles.button}
                disableTouchRipple
                label={this.props.buttonText || 'Close'}
                primary={false}
                onClick={this.props.onClose}
            />,
        ];

        // if actions have been passed in, use those instead of the default
        const actions = this.props.actions ? this.props.actions : defaultActions;

        // display passed in title and a clear button which calls props.onClose
        const title = (
            <div className="qa-BaseDialog-div">
                <strong>{this.props.title ? this.props.title : ''}</strong>
                <Clear style={styles.clear} onClick={this.props.onClose} />
            </div>
        );

        return (
            <Dialog
                className="qa-BaseDialog-Dialog"
                contentStyle={styles.dialog}
                bodyStyle={styles.body}
                actions={actions}
                modal
                open={this.props.show}
                onRequestClose={this.props.onClose}
                title={title}
                titleStyle={styles.title}
                actionsContainerStyle={styles.actions}
            >
                <CustomScrollbar
                    autoHeight
                    autoHeightMax={400}
                >
                    {this.props.children}
                </CustomScrollbar>
            </Dialog>
        );
    }
}

BaseDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    buttonText: PropTypes.string,
    dialogStyle: PropTypes.object,
    titleStyle: PropTypes.object,
    bodyStyle: PropTypes.object,
    actionsStyle: PropTypes.object,
    labelStyle: PropTypes.object,
    buttonStyle: PropTypes.object
};

export default BaseDialog;
