import PropTypes from 'prop-types';
import React, { Component } from 'react';
import moment from 'moment';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import Modal from '@material-ui/core/Modal';
import Input from '@material-ui/core/Input';

export class DateFilter extends Component {
    constructor(props) {
        super(props);
        this.handleMinOpen = this.handleMinOpen.bind(this);
        this.handleMaxOpen = this.handleMaxOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleMinUpdate = this.handleMinUpdate.bind(this);
        this.handleMaxUpdate = this.handleMaxUpdate.bind(this);
        this.state = { open: '' };
    }

    handleMinOpen() {
        this.setState({ open: 'min' });
    }

    handleMaxOpen() {
        this.setState({ open: 'max' });
    }

    handleClose() {
        this.setState({ open: '' });
    }

    handleMinUpdate(date) {
        this.handleClose();
        this.props.onMinChange(moment(date).toISOString());
    }

    handleMaxUpdate(date) {
        this.handleClose();
        this.props.onMaxChange(moment(date).toISOString());
    }

    render() {
        const styles = {
            drawerSection: {
                width: '100%',
                paddingLeft: '10px',
                paddingRight: '10px',
            },
            container: {
                backgroundColor: '#fff',
                width: 'auto',
                height: 'auto',
                transform: 'translate(-50%, -50%)',
                position: 'absolute',
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
                                .DayPicker-NavButton { color: #4598bf; }
                            `}
                        </style>
                        <DayPicker
                            id="min"
                            selectedDays={min}
                            month={this.props.minDate ? min : new Date()}
                            onDayClick={this.handleMinUpdate}
                            modifiers={{ disabled: { after: this.props.maxDate ? max : undefined } }}
                            modifiersStyles={{ selected: { backgroundColor: '#4598bf' } }}
                            className="datepicker"
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
                            id="max"
                            selectedDays={max}
                            month={this.props.maxDate ? max : new Date()}
                            onDayClick={this.handleMaxUpdate}
                            modifiers={{ disabled: { before: min } }}
                            modifiersStyles={{ selected: { backgroundColor: '#4598bf' } }}
                            className="datepicker"
                        />
                    </div>
                </Modal>

                <Input
                    style={{ fontSize: '14px', borderBottom: '1px solid #707274' }}
                    value={this.props.minDate ? moment(this.props.minDate).format('YYYY-MM-DD') : ''}
                    onClick={this.handleMinOpen}
                    placeholder="From"
                    disableUnderline
                    fullWidth
                    readOnly
                />
                <Input
                    style={{ fontSize: '14px', borderBottom: '1px solid #707274' }}
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

DateFilter.defaultProps = {
    minDate: null,
    maxDate: null,
};

DateFilter.propTypes = {
    onMinChange: PropTypes.func.isRequired,
    onMaxChange: PropTypes.func.isRequired,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
};

export default DateFilter;
