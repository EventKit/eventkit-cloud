import {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { withTheme, Theme } from '@material-ui/core/styles';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import UserInfo from './UserInfo';
import LicenseInfo from './LicenseInfo';
import SaveButton from './SaveButton';
import getLicenses from '../../actions/licenseActions';
import { patchUser } from '../../actions/userActions';
import CustomScrollbar from '../common/CustomScrollbar';
import { DrawerTimeout } from '../../actions/uiActions';
import { joyride } from '../../joyride.config';
import EventkitJoyride from "../common/JoyrideWrapper";

export interface Props {
    theme: Eventkit.Theme & Theme;
}

export const Account = (props: Props) => {
    const user = useSelector((state: any) => state.user);
    const licenses = useSelector((state: any) => state.licenses);
    const drawer = useSelector((state: any) => state.drawer);
    const [acceptedLicenses, setAcceptedLicenses] = useState(user.data?.accepted_licenses || {});
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [steps, setSteps] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const dispatch = useDispatch();
    const [joyrideRef, setJoyride] = useState(null);

    const getPreviousValue = value => {
        const ref = useRef(value);
        useEffect(() => {
            ref.current = value;
        }, [value]);
        return ref.current;
    };

    const prevUserRef = getPreviousValue(user);

    const handleCheck = (slug, checked) => {
        const aLicenses = acceptedLicenses;
        aLicenses[slug] = checked;
        setAcceptedLicenses({ ...aLicenses });
    };

    const handleAll = (event, checked) => {
        const aLicenses = { ...acceptedLicenses };
        Object.keys(aLicenses).forEach((license) => {
            // if the command is to uncheck, make sure not to uncheck already agreed licenses
            if (!checked && user.data.accepted_licenses[license]) {
                // do nothing;
            } else {
                aLicenses[license] = checked;
            }
        });
        setAcceptedLicenses({ ...aLicenses });
    };

    const handleSubmit = () => {
        dispatch(patchUser(acceptedLicenses, user.data.user.username));
    };

    const joyrideAddSteps = (stepsToAdd) => {
        let newSteps = stepsToAdd;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) { return; }

        setSteps(steps.concat(newSteps));
    };

    const callback = (data) => {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'tour:end') {
            setIsRunning(false);
            joyrideRef?.reset(true);
            if (acceptedLicenses['fake-license-for-tour'] !== undefined) {
                setAcceptedLicenses({});
                licenses.licenses = [];
                user.data.accepted_licenses = {};
            }
        }

        if (data.index === 4 && data.type === 'step:after') {
            if (drawer === 'closed') {
                const timeout = new DrawerTimeout();
                dispatch(timeout.openDrawer());
            }
        }
    };

    const handleJoyride = () => {
        if (isRunning === true) {
            setIsRunning(false);
            joyrideRef?.reset(true);
        } else {
            setIsRunning(true);
            if (!Object.keys(licenses).length) {
                const fake = {
                    slug: 'fake-license-for-tour',
                    name: 'Page Tour Example License (Demonstration Purposes Only)',
                    text: 'This license is for the page tour and does not actually need to be accepted',
                };
                setAcceptedLicenses({ 'fake-license-for-tour': false });
                licenses.licenses.push(fake);
                user.data.accepted_licenses[fake.slug] = false;
            }
        }
    }

    useEffect(() => {
        //TODO: Should getLicenses be added here?
        dispatch(getLicenses());

        const steps = joyride.Account;
        joyrideAddSteps(steps);

    }, []);

    useEffect(() => {
        if (user.status.patched && prevUserRef && !prevUserRef.status.patched) {
            setShowSavedMessage(true);
            window.setTimeout(() => {
                setShowSavedMessage(false);
            }, 3000);
        }

    }, [user]);

    const { theme } = props;

    const styles = {
        body: {
            height: 'calc(100vh - 130px)',
            width: '100%',
            margin: 'auto',
            overflowY: 'hidden' as 'hidden',
        },
        bodyContent: {
            padding: '30px 34px',
            maxWidth: '1000px',
            margin: 'auto',
        },
        tourButton: {
            color: theme.eventkit.colors.primary,
            cursor: 'pointer',
            display: 'inline-block',
            marginRight: '30px',
        },
        tourIcon: {
            color: theme.eventkit.colors.primary,
            cursor: 'pointer',
            height: '18px',
            width: '18px',
            verticalAlign: 'middle',
            marginRight: '5px',
            marginBottom: '5px',
        },
    };

    const iconElementRight = (
        <ButtonBase
            onClick={handleJoyride}
            style={styles.tourButton}
        >
            <Help
                style={styles.tourIcon}
            />
            Page Tour
        </ButtonBase>
    );

    const equal = Object.keys(acceptedLicenses).every((key) => {
        return acceptedLicenses[key] === user.data.accepted_licenses[key];
    });

    return (
        <div style={{ backgroundColor: theme.eventkit.colors.white }}>
            <EventkitJoyride
                name="Account Page"
                callback={callback}
                ref={(instance) => setJoyride(instance)}
                steps={steps}
                continuous
                showSkipButton
                showProgress
                locale={{
                    // @ts-ignore
                    back: (<span>Back</span>),
                    // @ts-ignore
                    close: (<span>Close</span>),
                    // @ts-ignore
                    last: (<span>Done</span>),
                    // @ts-ignore
                    next: (<span>Next</span>),
                    // @ts-ignore
                    skip: (<span>Skip</span>),
                }}
                run={isRunning}
            />
            <PageHeader
                className="qa-Account-PageHeader"
                title="Account"
            >
                {iconElementRight}
                <SaveButton
                    saved={showSavedMessage}
                    saveDisabled={equal}
                    handleSubmit={handleSubmit}
                />
            </PageHeader>
            <div style={styles.body}>
                <CustomScrollbar style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                    <div style={styles.bodyContent} className="qa-Account-body">
                        {licenses.licenses.length > 0 ?
                            <div style={{ marginBottom: '34px' }} className="qa-Account-licenses">
                                <LicenseInfo
                                    user={user}
                                    licenses={licenses}
                                    acceptedLicenses={acceptedLicenses}
                                    onLicenseCheck={handleCheck}
                                    onAllCheck={handleAll}
                                />
                            </div>
                            :
                            null
                        }
                        {Object.keys(user.data.user).length > 0 ?
                            <div style={{ marginBottom: '34px' }} data-testid={"userInfo"} className="qa-Account-userInfo">
                                <UserInfo user={user.data.user} updateLink="" />
                            </div>
                            :
                            null
                        }
                    </div>
                </CustomScrollbar>
            </div>
        </div>
    );

};

export default withTheme(Account);
