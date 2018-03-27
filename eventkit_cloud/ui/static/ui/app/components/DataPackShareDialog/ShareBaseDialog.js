import React, { PropTypes, Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Clear from 'material-ui/svg-icons/content/clear';
import CustomScrollbar from '../CustomScrollbar';

export class ShareBaseDialog extends Component {
    constructor(props) {
        super(props);
        this.handleResize = this.handleResize.bind(this);
        this.state = {
            mobile: this.isMobile(),
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
        if (this.state.mobile !== this.isMobile()) {
            this.setState({ mobile: !this.state.mobile });
        }
    }

    isMobile() {
        return window.innerWidth < 768;
    }

    render() {
        const styles = {
            dialog: {
                width: 'calc(100% - 32px)',
                height: '100%',
                minWidth: '325px',
                maxWidth: '650px',
                transform: `translate(0px, ${this.state.mobile ? 16 : 64}px)`,
            },
            title: {
                padding: '25px',
                fontWeight: 'none',
                fontSize: '18px',
            },
            body: {
                padding: '0px 25px',
                maxHeight: '100%',
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
            <div className="qa-ShareBaseDialog-title">
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
                style={{ paddingTop: '0px' }}
                modal
                open={this.props.show}
                onRequestClose={this.props.onClose}
                title={title}
                titleStyle={styles.title}
                actionsContainerStyle={styles.actions}
                autoDetectWindowHeight={false}
                repositionOnUpdate={false}
            >
                <CustomScrollbar
                    style={{ height: this.state.mobile ? window.innerHeight - 200 : window.innerHeight - 296 }}
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
