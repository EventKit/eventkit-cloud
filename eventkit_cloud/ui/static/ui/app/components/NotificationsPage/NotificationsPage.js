import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress, GridList, Paper } from 'material-ui';
import CustomScrollbar from '../CustomScrollbar';
import NotificationsTable from '../Notification/NotificationsTable';
import NotificationGridItem from '../Notification/NotificationGridItem';
import LoadButtons from '../DataPackPage/LoadButtons';
import { getNotifications } from '../../actions/notificationsActions';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class NotificationsPage extends React.Component {
    constructor(props) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.isSameOrderType = this.isSameOrderType.bind(this);
        this.getHeaderStyle = this.getHeaderStyle.bind(this);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.state = {
            loadingPage: true,
        };
        this.refreshInterval = 10000;
        this.notificationsPerPage = 10;
        this.notificationsPage = 1;
    }

    componentDidMount() {
        this.refreshIntervalId = setInterval(this.refresh, this.refreshInterval);
        this.refresh();
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalId);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.notifications.fetched && !this.props.notifications.fetched) {
            this.setState({ loadingPage: false });
        }
    }

    refresh() {
        const pageSize = this.notificationsPage * this.notificationsPerPage;
        this.props.getNotifications({ pageSize });
    }

    isSameOrderType(unknown, known) {
        return unknown.replace(/-/, '') == known.replace(/-/, '');
    }

    getHeaderStyle(isActive) {
        return isActive ? {color: '#000', fontWeight: 'bold'} : {color: 'inherit'}
    }
    
    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    handleLoadMore() {

    }

    render() {
        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        let styles = {
            root: {
                position: 'relative',
                height: window.innerHeight - mainAppBarHeight,
                width: '100%',
                backgroundImage: `url(${backgroundUrl})`,
                color: 'rgba(0, 0, 0, 0.54)',
            },
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                zIndex: '0',
            },
            customScrollbar: {
                height: window.innerHeight - mainAppBarHeight - pageAppBarHeight,
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
            loadingOverlay: {
                position: 'absolute',
                height: '100%',
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                zIndex: '100',
            },
            loadingPage: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            },
            content: {
                marginBottom: '12px',
                maxWidth: '1920px',
                margin: 'auto',
            },
            tableRow: {
                marginLeft: '12px',
                paddingRight: '6px',
                height: '50px'
            },
            clickable: {
                cursor: 'pointer',
                width: 'min-content'
            },
            gridList: {
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
            },
            noData: {
                margin: `0 ${10 + this.getGridPadding()/2}px`,
                padding: '29px',
                fontSize: '25px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
        };

        return (
            <div style={styles.root}>
                <AppBar
                    className="qa-Notifications-AppBar"
                    style={styles.appBar}
                    title="Notifications"
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                />
                {this.state.loadingPage ?
                    <div style={styles.loadingOverlay}>
                        <CircularProgress
                            style={styles.loadingPage}
                            color="#4598bf"
                            size={50}
                        />
                    </div>
                    :
                    null
                }
                <CustomScrollbar style={styles.customScrollbar}>
                    {this.state.loadingPage ?
                        null
                        :
                        <div style={styles.content}>
                            {(this.props.notifications.notificationsSorted.length === 0) ?
                                <Paper
                                    className="qa-NotifcationsPage-NoData"
                                    style={styles.noData}
                                >
                                    {"You don't have any notifications."}
                                </Paper>
                                :
                                <div>
                                    {(window.innerWidth > 768) ?
                                        <NotificationsTable
                                            notifications={this.props.notifications}
                                            router={this.props.router}
                                        />
                                        :
                                        <div>
                                            <GridList
                                                key="NotificationsPageGridList"
                                                className="qa-NotificationsPage-Grid"
                                                cellHeight="auto"
                                                style={styles.gridList}
                                                padding={2}
                                                cols={1}
                                            >
                                                {this.props.notifications.notificationsSorted.map((notification) => (
                                                    <NotificationGridItem
                                                        key={`Notification-${notification.uid}`}
                                                        notification={notification}
                                                        router={this.props.router}
                                                    />
                                                ))}
                                            </GridList>
                                        </div>
                                    }
                                    <LoadButtons
                                        range="3/3"
                                        handleLoadMore={this.handleLoadMore}
                                        loadMoreDisabled={false}
                                    />
                                </div>
                            }
                        </div>
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

NotificationsPage.propTypes = {
    router: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
    return {
        notifications: state.notifications,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getNotifications: (args) => dispatch(getNotifications(args)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationsPage);
