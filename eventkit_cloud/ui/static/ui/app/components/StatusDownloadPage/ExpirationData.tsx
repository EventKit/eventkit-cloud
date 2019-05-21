import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';
import Edit from '@material-ui/icons/Edit';
import * as moment from 'moment';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';

interface Props {
    expiration: string;
    minDate: Date;
    maxDate: Date;
    handleExpirationChange: (date: Date) => void;
    adminPermissions: boolean;
    user: Eventkit.User;
    theme: Eventkit.Theme & Theme;
}

interface State {
    anchor: null | HTMLElement;
}

export class ExpirationData extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.state = {
            anchor: null,
        };
    }

    private handleDayClick(date: Date) {
        this.handleClose();
        this.props.handleExpirationChange(date);
    }

    private handleClick(e: React.MouseEvent<any>) {
        this.setState({ anchor: e.currentTarget });
    }

    private handleClose() {
        this.setState({ anchor: null });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            tableRowInfoIcon: {
                marginLeft: '10px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                fill: colors.primary,
                verticalAlign: 'middle',
            },
        };

        const expiration = moment(this.props.expiration).format('M/D/YY');

        if (!this.props.adminPermissions) {
            return (
                <React.Fragment>{expiration}</React.Fragment>
            );
        } else {
            return (
                <React.Fragment>
                    {expiration}
                    <Edit
                        onClick={this.handleClick}
                        style={styles.tableRowInfoIcon}
                    />
                    <Popover
                        className="qa-ExpirationData-Popover"
                        open={Boolean(this.state.anchor)}
                        anchorEl={this.state.anchor}
                        onClose={this.handleClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <style>{'.DayPicker-Day { width: 34px; } .DayPicker { font-size: 14px; } '}</style>
                        <DayPicker
                            onDayClick={this.handleDayClick}
                            selectedDays={new Date(this.props.expiration)}
                            month={new Date(this.props.expiration)}
                            modifiers={{ disabled: { before: this.props.minDate, after: this.props.maxDate } }}
                            modifiersStyles={{ selected: { backgroundColor: colors.primary } }}
                            className="qa-ExpirationData-DayPicker"
                        />
                    </Popover>
                </React.Fragment>
            );
        }
    }
}

export default withTheme()(ExpirationData);
