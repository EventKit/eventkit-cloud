import Checkbox from '@material-ui/core/Checkbox';
import Warning from './Warning';
import UserLicense from './UserLicense';
import { withTheme, Theme } from "@material-ui/core/styles";

const USAGE_STATEMENT = (
    <strong>You must agree to all license agreements and/or terms of use!</strong>
);

export interface Props {
    user: Eventkit.Store.User;
    licenses: Eventkit.Store.Licenses;
    acceptedLicenses: { [slug: string]: boolean };
    onLicenseCheck: (slug: string, checked: boolean) => void;
    onAllCheck: (e: any, checked: boolean) => void;
    theme: Eventkit.Theme & Theme;
}

export const allTrue = (acceptedLicenses) => {
    return Object.keys(acceptedLicenses).every(l => acceptedLicenses[l]);
};

export const LicenseInfo = (props: Props) => {

    const { colors } = props.theme.eventkit;

    const styles = {
        checkbox: {
            width: '24px',
            height: '24px',
            verticalAlign: 'middle',
            marginRight: '10px',
            color: colors.primary,
        },
        checkboxContainer: {
            width: '100%',
            padding: '16px',
        },
    };
    const allAgreedSaved = allTrue(props.user.data.accepted_licenses);
    const allAgreedUnsaved = allTrue(props.acceptedLicenses);
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
                    onChange={props.onAllCheck}
                    data-testid={"allCheckbox"}
                />
                <span className="qa-LicenseInfo-All">ALL</span>
            </div>
            {props.licenses.licenses.map(license => (
                <UserLicense
                    key={license.slug}
                    license={license}
                    checked={props.acceptedLicenses[license.slug]}
                    onCheck={props.onLicenseCheck}
                    disabled={props.user.data.accepted_licenses[license.slug]}
                />
            ))}
        </div>
    );
};

export default withTheme(LicenseInfo);
