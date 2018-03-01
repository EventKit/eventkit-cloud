import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';
import AppBar from 'material-ui/AppBar';
import BreadcrumbStepper from './BreadcrumbStepper';
import ConfirmDialog from '../Dialog/ConfirmDialog';

export class CreateExport extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showLeaveWarningDialog: false,
            modified: false,
        };
        this.leaveRoute = null;
    }

    componentDidMount() {
        // Show warning dialog if we try to navigate away with changes.
        const route = this.props.routes[this.props.routes.length - 1];
        this.props.router.setRouteLeaveHook(route, (info) => {
            if (!this.state.modified || this.leaveRoute) {
                // No changes to lose, or we confirmed we want to leave.
                return true;
            }

            // We must have started making changes. Save the route we're trying to navigate to and show a warning.
            this.leaveRoute = info.pathname;
            this.setState({ showLeaveWarningDialog: true });
            return false;
        });
    }

    componentWillReceiveProps(nextProps) {
        if (!isEqual(nextProps.aoiInfo, this.props.aoiInfo) ||
            !isEqual(nextProps.exportInfo, this.props.exportInfo)) {
            this.setState({ modified: true });
        }
    }

    handleLeaveWarningDialogCancel = () => {
        this.setState({ showLeaveWarningDialog: false });
        this.leaveRoute = null;
    };

    handleLeaveWarningDialogConfirm = () => {
        this.props.router.push(this.leaveRoute);
    };

    render() {
        const pageTitle = "Create DataPack";
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
        };

        return (
            <div>
                <AppBar
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{marginTop: '2px'}}
                    iconElementLeft={<p style={{display: 'none'}}/>}
                />
                <BreadcrumbStepper />
                <div>
                    {this.props.children}
                </div>
                <ConfirmDialog
                    show={this.state.showLeaveWarningDialog}
                    title="ARE YOU SURE?"
                    onCancel={this.handleLeaveWarningDialogCancel}
                    onConfirm={this.handleLeaveWarningDialogConfirm}
                    confirmLabel="Yes, I'm Sure"
                    isDestructive={true}
                >
                    <strong>{"You haven't finished creating this DataPack yet. Any settings will be lost."}</strong>
                </ConfirmDialog>
            </div>
        );
    }
}

CreateExport.propTypes = {
    router: PropTypes.object.isRequired,
    routes: PropTypes.array.isRequired,
};

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        exportInfo: state.exportInfo,
    };
}

export default connect(
    mapStateToProps,
)(withRouter(CreateExport));
