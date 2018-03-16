import React, { PropTypes, Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Clear from 'material-ui/svg-icons/content/clear';
import CustomScrollbar from '../CustomScrollbar';

export class ShareBaseDialog extends Component {
    render() {
        const styles = {
            dialog: {
                width: '70%',
                minWidth: '325px',
                maxWidth: '600px',
                maxHeight: '90%',
            },
            title: {
                padding: '25px',
                fontWeight: 'none',
                fontSize: '18px',
            },
            body: {
                padding: '0px 25px',
            },
            actions: {
                padding: '25px',
            },
            clear: {
                float: 'right',
                fill: '#4598bf',
                cursor: 'pointer',
            },
            label: {
                color: 'whitesmoke',
                fontWeight: 'bold',
            },
            button: {
                backgroundColor: '#4598bf',
                borderRadius: '0px',
            },
        };

        const actions = [
            <RaisedButton
                className="qa-ShareBaseDialog-save"
                style={{ margin: '0px' }}
                labelStyle={{ color: 'whitesmoke', fontWeight: 'bold' }}
                buttonStyle={{ borderRadius: '0px' }}
                backgroundColor="#4598bf"
                disableTouchRipple
                label={this.props.submitButtonLabel}
                primary={false}
                onClick={this.props.handleSave}
                disabled={false}
            />,
            <FlatButton
                className="qa-ShareBaseDialog-cancel"
                style={{ margin: '0px', float: 'left' }}
                labelStyle={{ color: '#4598bf', fontWeight: 'bold' }}
                backgroundColor="#fff"
                disableTouchRipple
                label="CANCEL"
                onClick={this.props.onClose}
            />,
        ];

        // display passed in title and a clear button which calls props.onClose
        const title = (
            <div className="qa-ShareBaseDialog-div">
                <strong>{this.props.title}</strong>
                <Clear style={styles.clear} onClick={this.props.onClose} />
            </div>
        );

        return (
            <Dialog
                className="qa-ShareBaseDialog-Dialog"
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
                    // this isnt great, but we hard code the max body height since
                    // the scrollbar autoHeight doesnt expand to the dialog body max on its own
                    autoHeightMax={window.innerHeight - 296}
                >
                    {this.props.children}
                </CustomScrollbar>
            </Dialog>
        );
    }
}

ShareBaseDialog.defaultProps = {
    title: 'SHARE',
    children: [],
    submitButtonLabel: 'SAVE',
};

ShareBaseDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    title: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.string,
    ]),
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]),
    submitButtonLabel: PropTypes.string,
};

export default ShareBaseDialog;
