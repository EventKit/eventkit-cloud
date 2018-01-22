import React, { PropTypes, Component } from 'react';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import Lock from 'material-ui/svg-icons/action/lock';
import SocialGroup from 'material-ui/svg-icons/social/group';
import SocialPublic from 'material-ui/svg-icons/social/public';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';

export class PermissionsFilter extends Component {
    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                lineHeight: '36px',
            },
            radioButton: {
                width: '100%',
                marginBottom: '5px',
            },
            radioIcon: {
                fill: 'grey',
                marginRight: '5px',
            },
            radioLabel: {
                color: 'grey',
                width: '100%',
            },
            icon: {
                fill: 'grey',
                height: '26px',
                flex: '0 0 auto',
            },
        };

        const checkIcon = (<CheckCircle style={{ fill: '#4598bf' }} />);

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-PermissionsFilter-p"
                    style={{ width: '100%', margin: '0px' }}
                >
                    <strong >Permissions</strong>
                </p>
                <RadioButtonGroup
                    className="qa-PermissionsFilter-RadioButtonGroup"
                    name="permissions"
                    onChange={this.props.onChange}
                    valueSelected={this.props.valueSelected}
                    style={{ width: '100%' }}
                >
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-private"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="private"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Private (only me)
                                </div>
                                <Lock style={styles.icon} />
                            </div>
                        }
                    />
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-public"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="public"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Public (everyone)
                                </div>
                                <SocialPublic style={styles.icon} />
                            </div>
                        }
                    />
                    <RadioButton
                        className="qa-PermissionsFilter-RadioButton-group"
                        style={styles.radioButton}
                        iconStyle={styles.radioIcon}
                        labelStyle={styles.radioLabel}
                        value="group"
                        checkedIcon={checkIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Group Shared (only)
                                </div>
                                <SocialGroup style={styles.icon} />
                            </div>
                        }
                    />
                </RadioButtonGroup>
            </div>
        );
    }
}

PermissionsFilter.propTypes = {
    valueSelected: PropTypes.oneOf(['public', 'private', 'group']).isRequired,
    onChange: PropTypes.func.isRequired,
};

export default PermissionsFilter;
