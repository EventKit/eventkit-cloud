import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import withWidth, {isWidthUp} from "@material-ui/core/withWidth";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest, ApiStatuses} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";
import {useRunContext} from "./RunFileContext";
import {useEffect, useState} from "react";
import {DepsHashers, usePrevious} from "../../utils/hooks/hooks";
import axios from "axios";
import {CircularProgress, IconButton} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Popover from "@material-ui/core/Popover";

const jss = (theme: Eventkit.Theme & Theme) => ({
    button: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary_dark,
            color: theme.eventkit.colors.primary,
        },
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.white,
            color: theme.eventkit.colors.primary,
        }
    },
    buttonDisabled: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.white,
            color: theme.eventkit.colors.primary,
        }
    },
    popoverBlock: {
        display: 'flex',
        height: '35px',
        color: 'primary',
        position: 'sticky' as 'sticky',
        bottom: 0,
    },
    fakeButton: {
        cursor: 'pointer',
        position: 'absolute' as 'absolute',
        width: '100%', height: '100%',
        pointerEvents: 'auto' as 'auto',
    },
    preview: {
        height: '1000px',
        width: '1000px',
    },
    dialog: {
        margin: '10px',
    }
});

interface Props {
    fontSize: string;
    classes: { [className: string]: string; }
    providerTaskUids: string[];
    theme: Eventkit.Theme & Theme;
}


function CreateDataPackButton(props: Props) {
    const {fontSize, providerTaskUids, classes, theme} = props;
    const {run} = useRunContext();

    const [anchor, setAnchor] = useState(null);
    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(e.currentTarget);
    };

    const handlePopoverClose = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(null);
    };

    const requestOptions = {
        url: `/api/runs/zipfiles`,
        headers: {'X-CSRFToken': getCookie('csrftoken')},
    }
    const [{status: zipAvailableStatus, response: zipAvailableResponse}, zipAvailAbleCall, clearZipAvailable] = useAsyncRequest();
    const checkZipAvailable = () => {
        // Returned promise is ignored, we don't need it.
        zipAvailAbleCall({
            ...requestOptions,
            method: 'GET',
            params: {
                data_provider_task_record_uids: providerTaskUids.join(','),
            }
        });
    };

    const [{status: requestZipFileStatus, response: requestZipFileResponse}, requestZipFileCall, clearRequestZipFile] = useAsyncRequest();
    const postZipRequest = () => {

        // Returned promise is ignored, we don't need it.
        requestZipFileCall({
            ...requestOptions,
            method: 'POST',
            data: {
                data_provider_task_record_uids: providerTaskUids,
            },
        });
    };

    useEffect(() => {
        clearZipAvailable();
    }, [DepsHashers.arrayHash(providerTaskUids), run.status]);

    const [badResponse, setBadResponse] = useState(false);
    useEffect(() => {
        let timeoutId;
        if (zipAvailableStatus === ApiStatuses.hookActions.NOT_FIRED) {
            checkZipAvailable();
        } else {
            if (zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
                requestZipFileStatus !== ApiStatuses.hookActions.NOT_FIRED &&
                !isZipAvailable()) {
                if (!zipAvailableResponse.data.length) {
                    setBadResponse(true);
                } else {
                    timeoutId = setTimeout(() => {
                        checkZipAvailable();
                    }, 5000);
                }
            }
        }
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }, [zipAvailableStatus]);

    function isRunCompleted() {
        // TODO: add enum for run statuses to ApiStatuses object
        return run.status === 'COMPLETED';
    }

    function isZipAvailable() {
        return zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
            zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status === ApiStatuses.files.SUCCESS;
    }

    function getButtonText() {
        if (!isRunCompleted()) {
            return 'Job Processing...';
        }
        if (isZipAvailable()) {
            return 'DOWNLOAD DATAPACK (.ZIP)';
        }
        if (!!zipAvailableResponse && zipAvailableResponse.status === 'PENDING' ||
            zipAvailableStatus === ApiStatuses.hookActions.FETCHING || badResponse) {
            return 'Processing Zip...';
        }
        return 'CREATE DATAPACK (.ZIP)';
    }
    const buttonText = getButtonText();

    function getPopoverMessage() {
        if (buttonText === 'Processing Zip...') {
            if (zipIsProcessing()) {
                return zipAvailableResponse.data[0].message;
            }
            return 'Processing zip file.'
        }
        return 'We are creating your zip file. We will let you know in the notifications panel when it is ready.'
    }

    function shouldEnableButton() {
        if (isZipAvailable()) {
            return true;
        }
        return isRunCompleted() && requestZipFileStatus === ApiStatuses.hookActions.NOT_FIRED;
    }

    // Whether the button is enabled in a manner that triggers an action (download/POST)
    const buttonEnabled = shouldEnableButton();

    async function buttonAction(e: React.MouseEvent<HTMLElement>) {
        if (!isZipAvailable() && buttonEnabled) {
            postZipRequest();
            clearZipAvailable();
        } else if (!isZipAvailable()) {
            handlePopoverOpen(e);
        }
    }

    function zipIsProcessing() {
        // Return true when the zip is available and in some kind of state that indicates it will be available
        // after a period of processing (pending or running)
        return zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
            zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status && (
                zipAvailableResponse.data[0].status === ApiStatuses.files.PENDING ||
                zipAvailableResponse.data[0].status === ApiStatuses.files.RUNNING
            )
    }

    function getCloudDownloadIcon() {
        const {colors} = theme.eventkit;
        let iconProps: { style?: any; className?: string; };
        if (buttonEnabled) {
            iconProps = {
                style: {fill: colors.primary},
                className: 'qa-DataPack-button-enabled',
            }

        } else {
            iconProps = {
                style: {fill: colors.white, color: colors.primary},
                className: 'qa-DataPack-button-disabled"',
            }
        }
        iconProps.style = {
            ...iconProps.style,
            ...{
                verticalAlign: 'middle', marginRight: '5px',
            }
        }
        let Component: any = CloudDownload;
        if (!isRunCompleted() ||
            zipAvailableStatus === ApiStatuses.hookActions.FETCHING ||
            zipIsProcessing()
        ) {
            Component = CircularProgress;
        }
        return (
            <Component
                {...iconProps}
            />
        );
    }

    return (
        <div style={{display: 'flex'}}>
            <Button
                id="CompleteDownload"
                variant="contained"
                className={`qa-DataPackDetails-Button-zipButton`}
                classes={{root: (buttonEnabled) ? classes.button : classes.buttonDisabled}}
                disabled={!buttonEnabled}
                style={{fontSize: fontSize, lineHeight: 'initial'}}
                onClick={buttonAction}
                {...(() => {
                    const extraProps = {} as { href: string };
                    if (isZipAvailable()) {
                        extraProps.href = zipAvailableResponse.data[0].url;
                    }
                    return extraProps
                })()}
            >
                {!buttonEnabled && (
                    <div onClick={buttonAction} className={classes.fakeButton}/>
                )}
                {getCloudDownloadIcon()}
                {buttonText}
                <div className={classes.popoverBlock}>
                    <Popover
                        PaperProps={{
                            style: {padding: '16px', width: '30%'}
                        }}
                        open={!!anchor}
                        anchorEl={anchor}
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
                                {getPopoverMessage()}
                            </div>
                        </div>
                    </Popover>
                </div>
            </Button>
            <InfoDialog
                iconProps={{style: {margin: 'auto 0'}}}
                className="qa-CreateDataPackButton-info-dialog"
                title="DataPack Information"
            >
                <div style={{paddingBottom: '10px', wordWrap: 'break-word'}}>
                    For convenience, EventKit bundles all the individual data sources into a single
                    download
                    (formatted as a .zip file).
                    Additionally, this file contains GIS application files (QGIS and ArcMap),
                    cartographic styles, metadata, and associated documents.
                    See the Page Tour for more details about other elements of the Status and
                    Download page.
                    Detailed information about how to use the DataPacks in QGIS and ArcMap are in
                    the About EventKit page and in the metadata of the DataPack.
                </div>
            </InfoDialog>
        </div>
    )
}


export default withWidth()(withTheme()(withStyles(jss)(CreateDataPackButton)));