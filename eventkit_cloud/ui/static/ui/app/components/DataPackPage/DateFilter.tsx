import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import * as moment from 'moment';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import Modal from '@material-ui/core/Modal';
import Input from '@material-ui/core/Input';

export interface Props {
    onMinChange: (date: string) => void;
    onMaxChange: (date: string) => void;
    minDate: null | string;
    maxDate: null | string;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    open: string;
}

export class DateFilter extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.handleMinOpen = this.handleMinOpen.bind(this);
        this.handleMaxOpen = this.handleMaxOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleMinUpdate = this.handleMinUpdate.bind(this);
        this.handleMaxUpdate = this.handleMaxUpdate.bind(this);
        this.state = { open: '' };
    }

    private handleMinOpen() {
        this.setState({ open: 'min' });
    }

    private handleMaxOpen() {
        this.setState({ open: 'max' });
    }

    private handleClose() {
        this.setState({ open: '' });
    }

    private handleMinUpdate(date: Date) {
        this.handleClose();
        this.props.onMinChange(moment(date).toISOString());
    }

    private handleMaxUpdate(date: Date) {
        this.handleClose();
        this.props.onMaxChange(moment(date).toISOString());
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
            },
            container: {
                backgroundColor: colors.white,
                width: 'auto',
                height: 'auto',
                transform: 'translate(-50%, -50%)',
                position: 'absolute' as 'absolute',
                left: '50%',
                top: '50%',
            },
        };

        const max = new Date(this.props.maxDate);
        const min = new Date(this.props.minDate);

        return (
            <div
                className="qa-DateFilter-div"
                style={styles.drawerSection}
            >
                <p
                    className="qa-DateFilter-p"
                    style={{ width: '100%', margin: '0px', lineHeight: '36px' }}
                >
                    <strong>Date Added</strong>
                </p>
                <Modal
                    open={this.state.open === 'min'}
                    onClose={this.handleClose}
                    style={{ zIndex: 1501 }}
                >
                    <div
                        style={styles.container}
                    >
                        <style>
                            {`
                                .DayPicker { font-size: 14px; }
                                .DayPicker-Day { width: 34px; }
                                .DayPicker-Caption > div { font-weight: 700; }
                                .DayPicker-NavButton { color: ${colors.primary}; }
                            `}
                        </style>
                        <DayPicker
                            selectedDays={min}
                            month={this.props.minDate ? min : new Date()}
                            onDayClick={this.handleMinUpdate}
                            modifiers={{ disabled: { after: this.props.maxDate ? max : undefined } }}
                            modifiersStyles={{ selected: { backgroundColor: colors.primary } }}
                            className="datepicker datepicker-min"
                        />
                    </div>
                </Modal>

                <Modal
                    open={this.state.open === 'max'}
                    onClose={this.handleClose}
                    style={{ zIndex: 1501 }}
                >
                    <div
                        style={styles.container}
                    >
                        <style>
                            {`
                                .DayPicker { font-size: 14px; }
                                .DayPicker-Day { width: 34px; }
                            `}
                        </style>
                        <DayPicker
                            selectedDays={max}
                            month={this.props.maxDate ? max : new Date()}
                            onDayClick={this.handleMaxUpdate}
                            modifiers={{ disabled: { before: min } }}
                            modifiersStyles={{ selected: { backgroundColor: colors.primary } }}
                            className="datepicker datepicker-max"
                        />
                    </div>
                </Modal>

                <Input
                    style={{ fontSize: '14px', borderBottom: `1px solid ${colors.text_primary}` }}
                    value={this.props.minDate ? moment(this.props.minDate).format('YYYY-MM-DD') : ''}
                    onClick={this.handleMinOpen}
                    placeholder="From"
                    disableUnderline
                    fullWidth
                    readOnly
                />
                <Input
                    style={{ fontSize: '14px', borderBottom: `1px solid ${colors.text_primary}` }}
                    value={this.props.maxDate ? moment(this.props.maxDate).format('YYYY-MM-DD') : ''}
                    onClick={this.handleMaxOpen}
                    placeholder="To"
                    disableUnderline
                    fullWidth
                    readOnly
                />
            </div>
        );
    }
}

export default withTheme()(DateFilter);
