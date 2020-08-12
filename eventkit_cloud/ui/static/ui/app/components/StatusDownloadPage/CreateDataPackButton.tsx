import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest, ApiStatuses, FileStatus} from "../../utils/hooks/api";
import {formatMegaBytes, getCookie} from "../../utils/generic";
import {useRunContext} from "./RunFileContext";
import {useEffect, useRef, useState} from "react";
import {DepsHashers, usePrevious} from "../../utils/hooks/hooks";
import {CircularProgress, IconButton} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Popover from "@material-ui/core/Popover";
import AlertError from "@material-ui/icons/Error";
import CenteredPopup from "../common/CenteredPopup";

// Interval in ms
const ZIP_POLLING_INTERVAL = 5000;

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
            justifyContent: 'start',
            fontSize: '16px',
        }
    },
    buttonDisabled: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        textTransform: 'none' as 'none',
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.white,
            color: theme.eventkit.colors.primary,
            justifyContent: 'start',
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
    disabledText: {
        textTransform: 'none' as 'none',
        fontWeight: 'normal' as 'normal',
        fontSize: '20px',
    },
    preview: {
        height: '1000px',
        width: '1000px',
    },
    dialog: {
        margin: '10px',
    },
    iconButton: {
        float: 'right' as 'right',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
});

interface Props {
    zipSize: number;
    fontSize: string;  // Pass through font size to be consistent with parent.
    classes: { [className: string]: string; };
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
    };
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
        // If the list of provider task UID's changes, or the status of the run changes,
        // We will attempt to clear the status of the zip available api hook.
        // This will cancel any pending request (for a different set of UID's, or it will trigger a check
        // once the job completes.
        if (zipAvailableStatus !== ApiStatuses.hookActions.NOT_FIRED) {
            clearZipAvailable();
        }
    }, [DepsHashers.arrayHash(providerTaskUids), run.status]);

    // Keeps track of the cumulative number of bad responses (could be error codes OR empty responses)
    // We do this to allow the backend some leeway in preparing the response and account for some intermittent
    // network issues.
    const [badResponseCount, setBadResponseCount] = useState(0);
    const [badResponse, setBadResponse] = useState(false);
    useEffect(() => {
        let timeoutId;
        if (zipAvailableStatus === ApiStatuses.hookActions.NOT_FIRED) {
            // This case accounts for when the user first lands on the page.
            // We will immediately fire a request looking for the specified zip.
            checkZipAvailable();
        } else {
            // Check to see if the zip GET request returned successfully, and the zip POST request has been fired,
            // and then finally that the zip is not yet available.
            if (
                (zipAvailableStatus === ApiStatuses.hookActions.SUCCESS || zipAvailableStatus === ApiStatuses.hookActions.ERROR) &&
                requestZipFileStatus !== ApiStatuses.hookActions.NOT_FIRED &&
                !isZipAvailable()
            ) {
                // Request completed, check to see if we're already at the limit for bad responses
                if (badResponseCount >= 3) {
                    setBadResponse(true);
                } else {
                    // Deal with bad responses, increase the count.
                    if (!zipAvailableResponse.data.length) {
                        setBadResponseCount(count => count + 1);
                    }
                    // Set a time out to re-poll for the status of the zip after five seconds.
                    timeoutId = setTimeout(() => {
                        checkZipAvailable();
                    }, ZIP_POLLING_INTERVAL);
                }
            }
        }
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [zipAvailableStatus]);

    function isRunCompleted() {
        // TODO: add enum for run statuses to ApiStatuses object
        return ApiStatuses.finishedStates.includes(run.status as FileStatus);
    }

    function isRunCanceled() {
        // TODO: add enum for run statuses to ApiStatuses object
        return run.status == ApiStatuses.files.CANCELED;
    }

    function zipIsProcessing() {
        // Return true when the zip is available and in some kind of state that indicates it will be available
        // after a period of processing (pending or running)
        return zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
            zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status && (
                ApiStatuses.inProgressStates.includes(zipAvailableResponse.data[0].status as FileStatus)
            );
    }

    function isZipAvailable() {
        return zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
            zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status === ApiStatuses.files.SUCCESS;
    }

    const previousFrameText = useRef('');

    function getButtonText() {
        const sizeText = (props.zipSize) ? formatMegaBytes(props.zipSize, 1) + ' ' : '';
        // We do this to prevent the text from rapidly flickering between different states when we fire
        // off a request.
        if (
            (zipAvailableStatus === ApiStatuses.hookActions.FETCHING) ||
            (requestZipFileStatus === ApiStatuses.hookActions.FETCHING)
        ) {
            if (previousFrameText.current === '') {
                previousFrameText.current = 'Processing Zip...';
            }
            return previousFrameText.current;
        }
        if (isRunCanceled()) {
            return 'Zip Canceled';
        }
        if (!isRunCompleted()) {
            return 'Job Processing...';
        }
        if (isZipAvailable()) {
            return `DOWNLOAD DATAPACK (${sizeText}.ZIP)`;
        }
        if (badResponse) {
            return 'Zip Error';
        }
        if (requestZipFileStatus === ApiStatuses.hookActions.NOT_FIRED) {
            return `CREATE DATAPACK (${sizeText}.ZIP)`;
        }
        return 'Processing Zip...';
    }

    const buttonText = getButtonText();
    previousFrameText.current = buttonText;

    function getPopoverMessage() {
        if (!isRunCompleted()) {
            return 'The DataPack is being built. Downloads will be available for request upon completion.';
        }
        if (badResponse) {
            return 'Could not retrieve zip information, please try again or contact an administrator.';
        }
        if (isRunCanceled()) {
            return (
                <p>
                    The datapack was canceled, so no zip is available. You can Rerun the datapack,
                    to generate the files. If you don't have permission to rerun you can clone this
                    datapack to generate the files.
                </p>
            );
        }
        if (zipIsProcessing()) {
            return zipAvailableResponse.data[0].message || 'Processing zip file.';
        }
        return '';
    }

    const popoverText = getPopoverMessage();

    // Whether the button is enabled in a manner that triggers an action (download/POST)
    // This will enable the MUI button, but we also allow clicks
    function shouldEnableButton() {
        if (isZipAvailable()) {
            return true;
        }
        if (isRunCanceled()) {
            return false;
        }
        return isRunCompleted() && requestZipFileStatus === ApiStatuses.hookActions.NOT_FIRED;
    }

    const buttonEnabled = shouldEnableButton();

    const [displayCreatingMessage, setDisplayCreatingMessage] = useState(false);

    async function buttonAction(e: React.MouseEvent<HTMLElement>) {
        if (!isZipAvailable() && buttonEnabled) {
            postZipRequest();
            // Clear the zipAvailableStatus
            setTimeout(() => clearZipAvailable(), 150);
            setDisplayCreatingMessage(true);
        } else if (!isZipAvailable()) {
            handlePopoverOpen(e);
        }
    }

    // Builds the icon that is displayed to the left of the button text.
    // Can be a spinner during processing, cloud download icon, or error icon.
    function getButtonIcon() {
        const {colors} = theme.eventkit;
        let iconProps: any = {
            style: {
                fill: colors.primary
            },
            className: 'qa-DataPack-button-enabled',
        };
        if (!buttonEnabled) {
            iconProps = {
                style: {fill: colors.white, color: colors.primary},
                className: 'qa-DataPack-button-disabled"',
            };
        }
        iconProps.style = {
            ...iconProps.style,
            ...{
                verticalAlign: 'middle', marginRight: '5px',
            },
        };
        let IconComponent: React.ComponentType<any> = CloudDownload;
        if (badResponse) {
            // This case controls for when we get no response back at all, usually an empty array.
            // This probably means no file could be retrieved for the specified provider tasks uids combo.
            IconComponent = AlertError;
            iconProps.style = {
                ...iconProps.style,
                fill: colors.warning,
            };
        } else if (!isRunCompleted() ||
            zipAvailableStatus === ApiStatuses.hookActions.FETCHING ||
            zipIsProcessing() ||
            buttonText === 'Processing Zip...'
        ) {
            IconComponent = CircularProgress;
            iconProps.size = 18;
        }
        return (
            <IconComponent
                {...iconProps}
            />
        );
    }

    return (
        <div style={{display: 'flex'}}>
            <Button
                id="CompleteDownload"
                variant="contained"
                className={`qa-CreateDataPackButton-Button-zipButton`}
                classes={{root: (buttonEnabled) ? classes.button : classes.buttonDisabled}}
                disabled={!buttonEnabled}
                style={{fontSize, lineHeight: 'initial', width: '250px'}}
                onClick={buttonAction}
                {...(() => {
                    // If the zip file is available, set the href of the button to the URL.
                    const extraProps = {} as { href: string };
                    if (isZipAvailable()) {
                        extraProps.href = zipAvailableResponse.data[0].url;
                    }
                    return extraProps;
                })()}
            >
                {!buttonEnabled && (
                    // This div is placed over top of the main button when it is disabled.
                    // It then acts as a button that allows users to open popovers.
                    // This allows us to leverage the built in disabled functionality on the MUI component
                    // while still being able to click the button. MUI stops all onClick events when disabled.
                    <div onClick={buttonAction} className={classes.fakeButton}
                         id="qa-CreateDataPackButton-fakeButton"/>
                )}
                {getButtonIcon()}
                <span className={`qa-textSpan ${!buttonEnabled ? classes.disabledText : ''}`}>{buttonText}</span>
                {displayCreatingMessage && (
                    <CenteredPopup
                        onClose={() => setDisplayCreatingMessage(false)}
                        open={true}
                    >
                        <div style={{display: 'contents' as 'contents'}}>
                            <IconButton
                                className={classes.iconButton}
                                type="button"
                                onClick={handlePopoverClose}
                            >
                                <CloseIcon/>
                            </IconButton>
                            <div style={{marginTop: '5px', fontSize: '20px'}}>
                                {!isZipAvailable() ? (
                                    <p>
                                        We are creating your zip file. We will let you know in the notifications
                                        panel
                                        when it
                                        is ready.
                                    </p>
                                ) : (
                                    <p>
                                        DataPack (.ZIP) ready for download.
                                    </p>
                                )}
                            </div>
                        </div>
                    </CenteredPopup>
                )}
                <div className={classes.popoverBlock}>
                    <Popover
                        {...{
                            PaperProps: {
                                style: {padding: '16px', width: '30%'}
                            },
                            open: !!anchor && !!popoverText,
                            anchorEl: anchor,
                            onClose: handlePopoverClose,
                            anchorOrigin: {
                                vertical: 'top',
                                horizontal: 'center',
                            },
                            transformOrigin: {
                                vertical: 'bottom',
                                horizontal: 'center',
                            },
                        }}
                    >
                        <div style={{display: 'contents' as 'contents'}}>
                            <IconButton
                                className={classes.iconButton}
                                type="button"
                                onClick={handlePopoverClose}
                            >
                                <CloseIcon/>
                            </IconButton>
                            <div style={{marginTop: '5px'}}>
                                {popoverText}
                            </div>
                        </div>
                    </Popover>
                </div>
            </Button>
            <InfoDialog
                iconProps={{style: {margin: 'auto 8px'}}}
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
    );
}

export default withTheme()(withStyles(jss)(CreateDataPackButton));
