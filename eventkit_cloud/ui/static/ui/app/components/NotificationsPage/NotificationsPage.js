import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress, GridList } from 'material-ui';
import CustomScrollbar from '../CustomScrollbar';
import { NotificationTable } from '../Notification/NotificationTable';
import NotificationGridItem from '../Notification/NotificationGridItem';
import LoadButtons from '../DataPackPage/LoadButtons';

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
            loadingPage: false,
        };
        this.refreshInterval = 10000;
    }

    componentDidMount() {
        this.refreshIntervalId = setInterval(this.refresh, this.refreshInterval);
        this.refresh();
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalId);
    }

    componentWillReceiveProps(nextProps) {
    }

    refresh({ showLoading = true } = {}) {
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
                border: '1px',
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
            },
        };

        ////////////////////////////////////////////////////
        // MOCK DATA
        const now = new Date();
        const mockNotifications = [
            {
                uid: 3,
                read: false,
                type: 'license-update',
                date: new Date().setMinutes(now.getMinutes() - 5),
            },
            {
                uid: 2,
                read: true,
                type: 'datapack-complete-error',
                date: new Date().setHours(now.getHours() - 5),
                data: {
                    run: {
                        uid: 2,
                        job: {
                            uid: 2,
                            name: 'B',
                        },
                        expiration: new Date(2018, 5, 1),
                    },
                },
            },
            {
                uid: 1,
                read: true,
                type: 'datapack-complete-success',
                date: new Date().setDate(now.getDate() - 5),
                data: {
                    run: {
                        uid: 1,
                        job: {
                            uid: 1,
                            name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                        },
                        expiration: new Date(2018, 5, 1),
                    },
                },
            },
        ];
        ///////////////////////////////////////////////

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
                            {(mockNotifications.length === 0) ?
                                <div style={{color: 'white', marginLeft: '27px', marginTop: '14px'}} className="qa-NotifcationsPage-NoData">
                                    {"You don't have any notifications."}
                                </div>
                                :
                                <div>
                                    {(window.innerWidth > 768) ?
                                        <NotificationTable
                                            notifications={mockNotifications}
                                            order={this.props.order}
                                        />
                                        :
                                        <div>
                                            <GridList
                                                key="NotificationsPageGridList"
                                                className="qa-NotificationsPage-Grid"
                                                cellHeight="auto"
                                                style={styles.gridList}
                                                padding={this.getGridPadding()}
                                                cols={1}
                                            >
                                                {mockNotifications.map((notification, index) => (
                                                    <NotificationGridItem
                                                        key={`Notification-${index}`}
                                                        notification={notification}
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
    user: PropTypes.object.isRequired,
    order: PropTypes.string.isRequired,
};

NotificationsPage.defaultProps = {
    order: 'notification__date',
};

function mapStateToProps(state) {
    return {
        user: state.user,
    };
}

function mapDispatchToProps(dispatch) {
    return {
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationsPage);
