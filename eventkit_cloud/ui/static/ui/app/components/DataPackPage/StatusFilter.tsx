import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Checkbox from '@mui/material/Checkbox';
import AlertError from '@mui/icons-material/Error';
import NotificationSync from '@mui/icons-material/Sync';
import NavigationCheck from '@mui/icons-material/Check';
import ToggleCheckBox from '@mui/icons-material/CheckBox';

export interface Props {
    onChange: (value: object) => void;
    completed: boolean;
    incomplete: boolean;
    submitted: boolean;
    theme: Eventkit.Theme & Theme;
}

export class StatusFilter extends Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
            },
            status: {
                display: 'flex',
                flexWrap: 'nowrap' as 'nowrap',
                lineHeight: '24px',
                paddingBottom: '10px',
                color: colors.text_primary,
                fontWeight: 700,
            },
            checkBox: {
                width: '24px',
                height: '24px',
                flex: '0 0 auto',
                marginRight: '5px',
            },
            checkmark: {
                color: colors.success,
            },
            sync: {
                fill: colors.running,
            },
            error: {
                fill: colors.warning,
                opacity: 0.6,
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

export default withTheme(StatusFilter);
