import React, {Component} from 'react';
import {connect} from 'react-redux';
import AppBar from 'material-ui/AppBar';
import RaisedButton from 'material-ui/RaisedButton';
import UserInfoBlock from './UserInfoBlock';
import UserLicense from './UserLicense';
import moment from 'moment';

export class Account extends Component {

    constructor(props) {
        super(props);
        this.handleResize = this.handleResize.bind(this);
        this.handleCheck = this.handleCheck.bind(this);
        this.state = {
            licenses: [
                {
                    slug: 'next-view',
                    name: 'NextView End User License Agreement (EULA)',
                    text: 'This data is licensed for use by the US Government (USG) under the NextView (NV) license and copyrighted by DigitalGlobe or GeoEye. The NV license allows the USG to share the imagery and Literal Imagery Derived Products (LIDP) with entities outside the USG when that entity is working directly with the USG, for the USG, or in a manner that is directly beneficial to the USG. The party receiving the data can only use the imagery or LIDP for the original purpose or only as otherwise agreed to by the USG. The party receiving the data cannot share the imagery or LIDP with a third party without express permission from the USG. At no time should this imagery or LIDP be used for other than USG-related purposes and must not be used for commercial gain. The copyright information should be maintained at all times. Your acceptance of these license terms is implied by your use'
                },
                {
                    slug: 'other-one',
                    name: 'This is some other license',
                    text: 'You should agree to this or something . . .'
                }
            ],
            user: {data: {username: 'admin', email: 'some.email@email.com', licenses: ['next-view']}},
            userLicenses: [],
        }
    };

    componentWillMount() {
        window.addEventListener('resize', this.handleResize);
        this.setState({userLicenses: this.state.user.data.licenses});
    };

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    };

    handleResize() {
        this.forceUpdate();
    };

    handleCheck(slug, checked) {
        if(checked && this.state.userLicenses.indexOf(slug) == -1) {
            const licenses = this.state.userLicenses;
            licenses.push(slug);
            this.setState({userLicenses: licenses});
        }
        else {
            const licenses = this.state.userLicenses;
            const ix = licenses.findIndex((e) => {
                return e == slug;
            });
            if(ix != -1) {
                licenses.splice(ix, 1);
                this.setState({userLicenses: licenses});
            }
        }
    };

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
                padding: '30px 34px',
                maxWidth: '1000px',
                margin: 'auto',
                overflowY: 'scroll'
            },
        };

        return (
            <div style={{backgroundColor: 'white'}}>
                <AppBar
                        title={'Account'}
                        style={styles.header}
                        titleStyle={styles.headerTitle}
                        showMenuIconButton={false}
                    />
                <div style={styles.body}>
                    <UserInfoBlock title={'Username'} data={this.props.user.data.username}/>
                    <UserInfoBlock title={'Email'} data={this.props.user.data.email}/>
                    <UserInfoBlock title={'Date Joined'} data={moment('2017-05-02T14:25:19Z').format('YYYY-MM-DD')}/>
                    
                    {this.state.licenses.map((license) => {
                        return (
                            <UserLicense 
                                key={license.slug}
                                license={license}
                                checked={this.state.userLicenses.includes(license.slug)}
                                onCheck={this.handleCheck}
                            />
                        );
                    })}
                    <RaisedButton backgroundColor={'#4498c0'} labelColor={'#fff'} fullWidth={true} label={'Update Settings'}/>
                </div>
            </div>
        )
    };
};

function mapStateToProps(state) {
    return {
        user: state.user
    }
};

export default connect(
    mapStateToProps,
    null
)(Account);
