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
        this.getGridPadding = this.getGridPadding.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.itemsPerPage = 12;
        this.state = {
            loadingPage: true,
            loading: true,
            pageSize: this.itemsPerPage,
        };
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.notifications.fetched && !this.props.notifications.fetched) {
            this.setState({
                loadingPage: false,
                loading: false,
            });
        }
    }

    refresh() {
        this.props.getNotifications({ pageSize: this.state.pageSize });
        this.setState({ loading: true });
    }
    
    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    handleLoadMore() {
        if (this.props.notifications.nextPage) {
            this.setState({
                pageSize: this.state.pageSize + this.itemsPerPage,
            }, this.refresh);
        }
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
                padding: '22px',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
        };

        const notifications = this.props.notifications.notificationsSorted.slice(0, this.state.pageSize);

        let range = '';
        if (this.props.notifications.range) {
            const rangeParts = this.props.notifications.range.split('/');
            range = (rangeParts.length === 2) ? `${notifications.length}/${rangeParts[1]}` : '';
        }

        return (
            <div style={styles.root}>
                <AppBar
                    className={'qa-Notifications-AppBar'}
                    style={styles.appBar}
                    title={'Notifications'}
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                />
                {this.state.loading ?
                    <div
                        style={{
                            zIndex: 10,
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                            <CircularProgress
                                style={{ margin: 'auto', display: 'block' }}
                                color={'#4598bf'}
                                size={50}
                            />
                        </div>
                    </div>
                    : null
                }
                <CustomScrollbar style={styles.customScrollbar}>
                    {this.state.loadingPage ?
                        null
                        :
                        <div
                            className={'qa-NotificationsPage-Content'}
                            style={styles.content}
                        >
                            {(notifications.length === 0) ?
                                <Paper
                                    className={'qa-NotificationsPage-Content-NoData'}
                                    style={styles.noData}
                                >
                                    {"You don't have any notifications."}
                                </Paper>
                                :
                                <div className={'qa-NotificationsPage-Content-Notifications'}>
                                    {(window.innerWidth > 768) ?
                                        <NotificationsTable
                                            notifications={this.props.notifications}
                                            notificationsArray={notifications}
                                            router={this.props.router}
                                        />
                                        :
                                        <GridList
                                            className={'qa-NotificationsPage-Content-Notifications-Grid'}
                                            cellHeight={'auto'}
                                            style={styles.gridList}
                                            padding={2}
                                            cols={1}
                                        >
                                            {notifications.map((notification) => (
                                                <NotificationGridItem
                                                    key={`Notification-${notification.id}`}
                                                    notification={notification}
                                                    router={this.props.router}
                                                />
                                            ))}
                                        </GridList>
                                    }
                                    <LoadButtons
                                        range={range}
                                        handleLoadMore={this.handleLoadMore}
                                        loadMoreDisabled={!this.props.notifications.nextPage}
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
    notifications: PropTypes.object.isRequired,
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
