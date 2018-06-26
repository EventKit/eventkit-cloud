import React, { PropTypes, Component } from 'react';
import Checkbox from 'material-ui/Checkbox';
import AlertError from 'material-ui/svg-icons/alert/error';
import NotificationSync from 'material-ui/svg-icons/notification/sync';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import ToggleCheckBox from 'material-ui/svg-icons/toggle/check-box';

export class StatusFilter extends Component {
    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
                lineHeight: '36px',
            },
            checkBox: {
                width: '100%',
                marginBottom: '5px',
            },
            checkIcon: {
                fill: 'grey',
                marginRight: '5px',
            },
            checkLabel: {
                width: '100%',
                color: 'grey',
            },
            checkmark: {
                color: '#bcdfbb',
            },
            sync: {
                fill: '#f4D225',
            },
            error: {
                fill: '#ce4427',
                opacity: '0.6',
            },
        };

        const checkedIcon = (<ToggleCheckBox style={{ fill: '#4598bf' }} />);

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-StatusFilter-p"
                    style={{ width: '100%', margin: '0px' }}
                >
                    <strong>Export Status</strong>
                </p>
                <div style={{ width: '100%' }}>
                    <Checkbox
                        className="qa-StatusFilter-Checkbox-complete"
                        style={styles.checkBox}
                        iconStyle={styles.checkIcon}
                        labelStyle={styles.checkLabel}
                        onCheck={(e, v) => { this.props.onChange({ completed: v }); }}
                        checked={this.props.completed}
                        checkedIcon={checkedIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Complete
                                </div>
                                <NavigationCheck style={styles.checkmark} />
                            </div>
                        }
                    />

                    <Checkbox
                        className="qa-StatusFilter-Checkbox-running"
                        style={styles.checkBox}
                        iconStyle={styles.checkIcon}
                        labelStyle={styles.checkLabel}
                        onCheck={(e, v) => { this.props.onChange({ submitted: v }); }}
                        checked={this.props.submitted}
                        checkedIcon={checkedIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Running
                                </div>
                                <NotificationSync style={styles.sync} />
                            </div>
                        }
                    />

                    <Checkbox
                        className="qa-StatusFilter-Checkbox-error"
                        style={styles.checkBox}
                        iconStyle={styles.checkIcon}
                        labelStyle={styles.checkLabel}
                        onCheck={(e, v) => { this.props.onChange({ incomplete: v }); }}
                        checked={this.props.incomplete}
                        checkedIcon={checkedIcon}
                        label={
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: '1 1 auto' }}>
                                    Error
                                </div>
                                <AlertError style={styles.error} />
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }
}

StatusFilter.propTypes = {
    onChange: PropTypes.func.isRequired,
    completed: PropTypes.bool.isRequired,
    incomplete: PropTypes.bool.isRequired,
    submitted: PropTypes.bool.isRequired,
};

export default StatusFilter;
