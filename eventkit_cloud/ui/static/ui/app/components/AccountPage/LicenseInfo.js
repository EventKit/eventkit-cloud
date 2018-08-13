import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Checkbox from 'material-ui/Checkbox';
import ToggleCheckBox from 'material-ui/svg-icons/toggle/check-box';
import ToggleCheckBoxOutlineBlank from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import Warning from './Warning';
import UserLicense from './UserLicense';

const USAGE_STATEMENT = (
    <strong>You must agree to all license agreements and/or terms of use!</strong>
);

export class LicenseInfo extends Component {
    allTrue(acceptedLicenses) {
        return Object.keys(acceptedLicenses).every(l => acceptedLicenses[l]);
    }

    render() {
        const styles = {
            checkbox: {
                width: '24px',
                display: 'inline-block',
                verticalAlign: 'middle',
                marginRight: '10px',
            },
            checkboxContainer: {
                width: '100%',
                padding: '16px',
            },
        };
        const allAgreedSaved = this.allTrue(this.props.user.data.accepted_licenses);
        const allAgreedUnsaved = this.allTrue(this.props.acceptedLicenses);
        return (
            <div className="qa-LicenseInfo-body">
                <h4><strong>Licenses and Terms of Use</strong></h4>
                <div className="qa-LicenseInfo-usage" style={{ color: 'grey' }}>
                    Usage of this product and all assets requires agreement to the following legalities:
                </div>
                {allAgreedSaved ?
                    null
                    :
                    <Warning className="qa-LicenseInfo-Warning" text={USAGE_STATEMENT} />
                }
                <div style={styles.checkboxContainer}>
                    <Checkbox
                        className="qa-LicenseInfo-Checkbox"
                        style={styles.checkbox}
                        disabled={allAgreedSaved}
                        checked={allAgreedUnsaved}
                        onCheck={this.props.onAllCheck}
                        checkedIcon={(
                            <ToggleCheckBox
                                className="qa-LicenseInfo-ToggleCheckBox"
                                style={{ fill: allAgreedSaved ? 'grey' : '#4498c0' }}
                            />
                        )}
                        uncheckedIcon={(
                            <ToggleCheckBoxOutlineBlank
                                className="qa-LicenseInfo-ToggleCheckBoxOutlineBlank"
                                style={{ fill: '#4498c0' }}
                            />
                        )}
                    />
                    <span>ALL</span>
                </div>
                {this.props.licenses.licenses.map(license => (
                    <UserLicense
                        key={license.slug}
                        license={license}
                        checked={this.props.acceptedLicenses[license.slug]}
                        onCheck={this.props.onLicenseCheck}
                        disabled={this.props.user.data.accepted_licenses[license.slug]}
                    />
                ))}
            </div>
        );
    }
}

LicenseInfo.propTypes = {
    user: PropTypes.object.isRequired,
    licenses: PropTypes.object.isRequired,
    acceptedLicenses: PropTypes.object.isRequired,
    onLicenseCheck: PropTypes.func.isRequired,
    onAllCheck: PropTypes.func.isRequired,
};

export default LicenseInfo;
