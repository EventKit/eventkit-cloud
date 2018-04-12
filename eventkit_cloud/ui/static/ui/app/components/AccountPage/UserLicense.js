import React, { Component, PropTypes } from 'react';
import Checkbox from 'material-ui/Checkbox';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import ToggleCheckBox from 'material-ui/svg-icons/toggle/check-box';
import ToggleCheckBoxOutlineBlank from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import HardwareKeyboardArrowDown from 'material-ui/svg-icons/hardware/keyboard-arrow-down';
import HardwareKeyboardArrowUp from 'material-ui/svg-icons/hardware/keyboard-arrow-up';
import CustomScrollbar from '../CustomScrollbar';

export class UserLicense extends Component {
    render() {
        const styles = {
            card: {
                boxShadow: 'none',
                marginBottom: '10px',
                border: this.props.checked ? 'none' : '1px solid red',
            },
            checkbox: {
                width: '24px',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
            cardText: {
                border: '2px solid #dedede',
                padding: '0px',
            },
        };

        return (
            <Card
                className="qa-UserLicense-Card"
                initiallyExpanded={false}
                style={styles.card}
                containerStyle={{ paddingBottom: '0px' }}
            >
                <CardHeader
                    className="qa-UserLicense-CardHeader"
                    style={{ backgroundColor: 'whitesmoke' }}
                    title={
                        <div>
                            <Checkbox
                                className="qa-UserLicense-Checkbox"
                                style={styles.checkbox}
                                checked={this.props.checked}
                                onCheck={(e, v) => { this.props.onCheck(this.props.license.slug, v); }}
                                checkedIcon={(
                                    <ToggleCheckBox
                                        className="qa-UserLicense-ToggleCheckBox"
                                        style={{ fill: this.props.disabled ? 'grey' : '#4498c0' }}
                                    />
                                )}
                                uncheckedIcon={(
                                    <ToggleCheckBoxOutlineBlank
                                        className="qa-UserLicense-ToggleCheckBoxOutlineBlank"
                                        style={{ fill: '#4498c0' }}
                                    />
                                )}
                                disabled={this.props.disabled}
                            />
                            <span className="qa-UserLicense-agreement" style={{ lineHeight: '24px' }}>
                                {'I agree to the '}<strong>{this.props.license.name}</strong>
                            </span>
                        </div>
                    }
                    actAsExpander={false}
                    showExpandableButton
                    openIcon={(
                        <HardwareKeyboardArrowUp className="qa-UserLicense-ArrowUp" style={{ fill: '#4498c0' }} />
                    )}
                    closeIcon={(
                        <HardwareKeyboardArrowDown className="qa-UserLicense-ArrowDown" style={{ fill: '#4498c0' }} />
                    )}
                />
                <CardText className="qa-UserLicense-CardText" expandable style={styles.cardText}>
                    <CustomScrollbar style={{ height: '200px', width: '100%' }}>
                        <div className="qa-UserLicense-licenseText" style={{ padding: '16px', whiteSpace: 'pre-wrap' }}>
                            <a href={`/api/licenses/${this.props.license.slug}/download`}>- Download this license text -</a>
                            <br />
                            <br />
                            {this.props.license.text}
                        </div>
                    </CustomScrollbar>
                </CardText>
            </Card>
        );
    }
}

UserLicense.propTypes = {
    license: PropTypes.object.isRequired,
    checked: PropTypes.bool.isRequired,
    onCheck: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
};

export default UserLicense;
