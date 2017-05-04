import React, {Component} from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import AppBar from 'material-ui/AppBar';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import UserInfoBlock from './UserInfoBlock';
import Warning from './Warning';
import UserLicense from './UserLicense';
import getLicenses from '../../actions/licenseActions';
import {patchUser} from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import moment from 'moment';

const USAGE_STATEMENT = 'Oops! It looks like you have not agreed to all the licenses required for access to the EventKit system. Please read through the agreements below and agree to all if you wish to continue using EventKit.'

export class Account extends Component {

    constructor(props) {
        super(props);
        this.handleResize = this.handleResize.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
    };

    componentWillMount() {
        this.props.getLicenses();
        window.addEventListener('resize', this.handleResize);
    };

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    };

    handleResize() {
        this.forceUpdate();
    };

    handleCheck(slug, checked) {
        let licenses = this.props.user.data.accepted_licenses
        if(checked) {
            licenses[slug] = true;
        }
        else {
            licenses[slug] = false;
        }
        this.props.patchUser(licenses, this.props.user.data.user.username);
    };

    allTrue(accepted_licenses) {
        for (const l in accepted_licenses) {
            if(accepted_licenses[l]) {continue;}
            else {return false;}
        }
        return true
    }

    render() {
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '30px',
                height: '25px',
                paddingLeft: '10px',
            },
            body: {
                height: window.innerHeight - 130,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
            },
            bodyContent: {
                padding: '30px 34px',
                maxWidth: '1000px', 
                margin: 'auto'
            }
        };

        const nextPage = this.props.location.query.redirect || this.props.location.query.next;
        if(nextPage && this.allTrue(this.props.user.data.accepted_licenses)) {
            browserHistory.push(nextPage);
        }

        return (
            <div style={{backgroundColor: 'white'}}>
                <AppBar
                        title={'Account'}
                        style={styles.header}
                        titleStyle={styles.headerTitle}
                        showMenuIconButton={false}
                    />
                
                <div style={styles.body}>
                    <CustomScrollbar style={{height: window.innerHeight - 130, width: '100%'}}>
                        <div style={styles.bodyContent}>
                            {this.allTrue(this.props.user.data.accepted_licenses) ? null: <Warning text={USAGE_STATEMENT}/>}
                            <UserInfoBlock title={'Username'} data={this.props.user.data.user.username}/>
                            {this.props.user.data.user.first_name ? <UserInfoBlock title={'First name'} data={this.props.user.data.user.first_name}/> : null}
                            {this.props.user.data.user.last_name ? <UserInfoBlock title={'Last name'} data={this.props.user.data.user.last_name}/> : null}
                            <UserInfoBlock title={'Email'} data={this.props.user.data.user.email}/>
                            <UserInfoBlock title={'Date Joined'} data={moment(this.props.user.data.user.date_joined).format('YYYY-MM-DD')}/>
                            <UserInfoBlock title={'Last Login'} data={moment(this.props.user.data.user.last_login).format('YYYY-MM-DD, h:mm:ss a')}/>
                            
                            {this.props.licenses.licenses.map((license) => {
                                return (
                                    <UserLicense 
                                        key={license.slug}
                                        license={license}
                                        checked={this.props.user.data.accepted_licenses[license.slug]}
                                        onCheck={this.handleCheck}
                                    />
                                );
                            })}
                        </div>
                    </CustomScrollbar> 
                </div>
                
            </div>
        )
    };
};

function mapStateToProps(state) {
    return {
        user: state.user,
        licenses: state.licenses,
    }
};

function mapDispatchToProps(dispatch) {
    return {
        getLicenses: () => {
            dispatch(getLicenses());
        },
        patchUser: (accepted_licenses, username) => {
            dispatch(patchUser(accepted_licenses, username));
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Account);
