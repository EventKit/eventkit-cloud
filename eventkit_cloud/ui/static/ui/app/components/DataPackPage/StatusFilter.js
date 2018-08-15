import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import AlertError from '@material-ui/icons/Error';
import NotificationSync from '@material-ui/icons/Sync';
import NavigationCheck from '@material-ui/icons/Check';
import ToggleCheckBox from '@material-ui/icons/CheckBox';

export class StatusFilter extends Component {
    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
            },
            status: {
                display: 'flex',
                flexWrap: 'nowrap',
                lineHeight: '24px',
                paddingBottom: '10px',
                color: '#707274',
                fontWeight: 700,
            },
            checkBox: {
                width: '24px',
                height: '24px',
                flex: '0 0 auto',
                marginRight: '5px',
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

        const checkedIcon = (<ToggleCheckBox color="primary" />);

        return (
            <div style={styles.drawerSection}>
                <p
                    className="qa-StatusFilter-p"
                    style={{ width: '100%', margin: '0px', lineHeight: '36px' }}
                >
                    <strong>Export Status</strong>
                </p>
                <div style={{ width: '100%' }}>
                    <div style={styles.status}>
                        <Checkbox
                            className="qa-StatusFilter-Checkbox-complete"
                            style={styles.checkBox}
                            onChange={(e, v) => { this.props.onChange({ completed: v }); }}
                            checked={this.props.completed}
                            checkedIcon={checkedIcon}
                        />
                        <div
                            className="qa-StatusFilter-title-complete"
                            style={{ display: 'flex', flex: '1 1 auto' }}
                        >
                            <div style={{ flex: '1 1 auto' }}>
                                Complete
                            </div>
                            <NavigationCheck style={styles.checkmark} />
                        </div>
                    </div>
                    <div style={styles.status}>
                        <Checkbox
                            className="qa-StatusFilter-Checkbox-running"
                            style={styles.checkBox}
                            onChange={(e, v) => { this.props.onChange({ submitted: v }); }}
                            checked={this.props.submitted}
                            checkedIcon={checkedIcon}
                        />
                        <div
                            className="qa-StatusFilter-title-running"
                            style={{ display: 'flex', flex: '1 1 auto' }}
                        >
                            <div style={{ flex: '1 1 auto' }}>
                                Running
                            </div>
                            <NotificationSync style={styles.sync} />
                        </div>
                    </div>
                    <div style={styles.status}>
                        <Checkbox
                            className="qa-StatusFilter-Checkbox-error"
                            style={styles.checkBox}
                            onChange={(e, v) => { this.props.onChange({ incomplete: v }); }}
                            checked={this.props.incomplete}
                            checkedIcon={checkedIcon}
                        />
                        <div
                            className="qa-StatusFilter-title-error"
                            style={{ display: 'flex', flex: '1 1 auto' }}
                        >
                            <div style={{ flex: '1 1 auto' }}>
                                Error
                            </div>
                            <AlertError style={styles.error} />
                        </div>
                    </div>
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
