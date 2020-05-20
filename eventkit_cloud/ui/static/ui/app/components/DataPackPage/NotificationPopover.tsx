import * as React from 'react';

import Popover from '@material-ui/core/Popover';
import WarningIcon from '@material-ui/icons/Warning';
import Typography from '@material-ui/core/Typography';
import {useState} from 'react';
import {
    createStyles, IconButton, Theme, withStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import axios from 'axios';
import {getCookie} from '../../utils/generic';
import {useAsyncRequest} from '../../utils/hooks';
import {connect} from "react-redux";
import AlertError from "@material-ui/core/SvgIcon/SvgIcon";
import theme from "../../styles/eventkit_theme";

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    popoverBlock: {
        display: 'flex',
        height: '35px',
        color: 'primary',
        position: 'sticky',
        bottom: 0,
    },
    warningIconBtn: {
        padding: '8px',
        color: theme.eventkit.colors.running,
        '&:hover': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    title: {
        color: theme.eventkit.colors.primary,
        paddingLeft: '5px',
        paddingTop: '9px',
        fontWeight: 600,
    },
    iconBtn: {
        float: 'right',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    alertIcon: {
        color: theme.eventkit.colors.warning,
        height: '18px',
        marginTop: '3px'
    },
    permissionNotificationText: {
        color: theme.eventkit.colors.primary,
        flex: '1 1 auto',
        paddingTop: '6px',
    },
});

interface Props extends React.HTMLAttributes<HTMLElement> {
    // provider: Eventkit.Provider;
    // providerInfo: Eventkit.Store.ProviderInfo;
    classes: { [className: string]: string };
}

const {CancelToken} = axios;

// const source = CancelToken.source();

export function NotificationPopover(props: Props) {
    // const [{ status: requestStatus, response }, requestCall] = useAsyncRequest();
    const [anchorElement, setAnchor] = useState(null);
    const {classes} = props;

    const csrfmiddlewaretoken = getCookie('csrftoken');
    // const makeRequest = async () => {
    //     const estimatedSize = providerInfo.estimates.size;
    //     requestCall({
    //         url: `/api/providers/requests/size`,
    //         method: 'post',
    //         data: {
    //             provider: provider.id,
    //             selection: geojson,
    //             requested_aoi_size: Math.round(aoiArea),
    //             requested_data_size: estimatedSize ? Math.trunc(estimatedSize.value) : undefined,
    //         },
    //         headers: { 'X-CSRFToken': csrfmiddlewaretoken },
    //         cancelToken: source.token,
    //     });
    // };

    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        setAnchor(e.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchor(null);
    };

    // async const handleSubmissionOpen = () => {
    //    if (Object.keys(props.geojson).length === 0) {
    //         return null;
    //     }
    //     await makeRequest();
    //     setSubmissionOpen(true);
    // }

    // const handleSubmissionClose = () => {
    //     setSubmissionOpen(false);
    // }

    // const handleErrorMessage = (response) => {
    //     const { data = {errors: []} } = !!response ? response.response : {};
    //     return (
    //         data.errors.map((error, ix) => (
    //             <span key={ix} title={error.title}>
    //                 {error.title}
    //             </span>
    //         ))
    //     )
    // }

    // const style = {
    //     base: {
    //         ...props.baseStyle,
    //     },
    //     icon: {
    //         verticalAlign: 'top',
    //         ...props.iconStyle,
    //     },
    // };

    const openEl = Boolean(anchorElement);
    // if (dataProviderListTasks.partial) {
    return (
        <div className={classes.popoverBlock}>
            <IconButton
                // className={classes.warningIconBtn}
                onClick={handlePopoverOpen}
            >
                <WarningIcon style={{color: theme.eventkit.colors.running}}/>
                {/*<AlertError/>*/}
            </IconButton>
            <span>
                <Typography variant="h6" gutterBottom className={classes.permissionNotificationText}>
                    Permission Notification
                </Typography>
            </span>
            <Popover
                // id={id}
                PaperProps={{
                    style: {padding: '16px', width: '30%'}
                }}
                open={openEl}
                anchorEl={anchorElement}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <div>
                    <IconButton
                        className={classes.iconBtn}
                        type="button"
                        onClick={handlePopoverClose}
                    >
                        <CloseIcon/>
                    </IconButton>
                    <div>
                        Some filters are unavailable due to user permissions. If you believe this is an error,
                        contact your administrator.
                    </div>
                    <span>
                        {/* <BaseDialog */}
                        {/*    actionsStyle={{ */}
                        {/*        margin: 'auto', */}
                        {/*        flexDirection: 'initial', */}
                        {/*        justifyContent: 'initial', */}
                        {/*        paddingBottom: '20px', */}
                        {/*    }} */}
                        {/*    titleStyle={{display: 'None'}} */}
                        {/*    bodyStyle={{padding: '35px 0px', textAlign: 'center', color: '#000'}} */}
                        {/*    buttonText="OK" */}
                        {/*    show={isSubmissionOpen} */}
                        {/*    onClose={handleSubmissionClose} */}
                        {/* > */}
                        {/*    <div> */}
                        {/*        {requestStatus !== 'error' && ( */}
                        {/*            <> */}
                        {/*                {requestStatus === 'pending' && ( */}
                        {/*                    <div>Pending Request</div> */}
                        {/*                )} */}
                        {/*                {requestStatus === 'success' && ( */}
                        {/*                    <div> */}
                        {/*                        <strong>Your increased data request has been submitted.</strong> */}
                        {/*                    </div> */}
                        {/*                )} */}
                        {/*            </> */}
                        {/*        )} */}
                        {/*        {requestStatus === 'error' && ( */}
                        {/*            <div> */}
                        {/*                Request Failure due to {handleErrorMessage(response)}. */}
                        {/*            </div> */}
                        {/*        )} */}
                        {/*    </div> */}
                        {/* </BaseDialog> */}
                    </span>
                </div>
            </Popover>
        </div>
    );
}

export default withStyles(jss)(NotificationPopover);
