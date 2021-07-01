import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest, ApiStatuses, FileStatus} from "../../utils/hooks/api";
import {binaryPrefixConversion, formatMegaBytes, getCookie, shouldDisplay} from "../../utils/generic";
import {useRunContext} from "./context/RunFile";
import {useEffect, useRef, useState} from "react";
import {DepsHashers, usePrevious} from "../../utils/hooks/hooks";
import {CircularProgress, IconButton} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import Popover from "@material-ui/core/Popover";
import AlertError from "@material-ui/icons/Error";
import CenteredPopup from "../common/CenteredPopup";
import RegionJustification from "./RegionJustification";
import {MatomoClickTracker} from "../MatomoHandler";
import {renderIf} from "../../utils/renderIf";

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
    fontSize: string;  // Pass through font size to be consistent with parent.
    classes: { [className: string]: string; };
    providerTasks: Eventkit.ProviderTask[];
    job: Eventkit.Job;
    theme: Eventkit.Theme & Theme;
}

export function CreateDataPackButton(props: Props) {
    const {fontSize, providerTasks, classes, theme} = props;
    const {run} = useRunContext();


    const [open, setOpen] = useState(true);
    const [dataPackRestricted, setDataPackRestricted] = useState(false);

    const [anchor, setAnchor] = useState(null);
    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(e.currentTarget);
    };

    const handlePopoverClose = (e: React.MouseEvent<HTMLElement>) => {
        setDisplayCreatingMessage(false);
        clearRequestZipFile();
        e.stopPropagation();
        setAnchor(null);
    };

    const requestOptions = {
        url: `/api/runs/zipfiles`,
        headers: {'X-CSRFToken': getCookie('csrftoken')},
    };
    const [{status: zipAvailableStatus, response: zipAvailableResponse}, zipAvailableCall, clearZipAvailable] = useAsyncRequest();
    const checkZipAvailable = () => {
        // Returned promise is ignored, we don't need it.
        zipAvailableCall({
            ...requestOptions,
            method: 'GET',
            params: {
                data_provider_task_record_uids: providerTasks.map(_providerTask => _providerTask.uid).join(','),
            }
        });
    };

    const [{status: requestZipFileStatus,}, requestZipFileCall, clearRequestZipFile] = useAsyncRequest();
    const postZipRequest = () => {
        // Returned promise is ignored, we don't need it.
        requestZipFileCall({
            ...requestOptions,
            method: 'POST',
            data: {
                data_provider_task_record_uids: providerTasks.map(_providerTask => _providerTask.uid).join(','),
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
    }, [DepsHashers.uidHash(providerTasks), run.status]);

    // Updates the status of the button.
    useEffect(() => {
        let timeoutId;
        // Need an initial check.
        if (zipAvailableStatus === ApiStatuses.hookActions.NOT_FIRED) {
            checkZipAvailable();
        }
        timeoutId = setTimeout(() => {
            if (isZipProcessing()) {
                checkZipAvailable();
            }
        }, ZIP_POLLING_INTERVAL);
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [zipAvailableResponse]);

    useEffect(() => {
        // Updates the status of the button.
        if (isRequestZipFileStatusBad()) {
            setDisplayCreatingMessage(true);
        }
    }, [requestZipFileStatus]);

    function isRunCompleted() {
        return ApiStatuses.finishedStates.includes(run.status as FileStatus);
    }

    function isRunCanceled() {
        return run.status === ApiStatuses.files.CANCELED;
    }

    function isZipProcessing() {
        // Return true when the zip is available and in some kind of state that indicates it will be available
        // after a period of processing (pending or running)
        return (zipAvailableResponse.data && zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status && (
                ApiStatuses.inProgressStates.includes(zipAvailableResponse.data[0].status as FileStatus)
            ));
    }

    function isZipAvailable() {
        return zipAvailableResponse.data && zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status === ApiStatuses.files.SUCCESS;
    }

    function isZipAvailableResponseBad() {
        return zipAvailableResponse.data && zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status === ApiStatuses.files.FAILED;
    }

    function isRequestZipFileStatusBad() {
        return requestZipFileStatus === ApiStatuses.hookActions.ERROR;
    }

    function isRequestZipFileStatusSuccessful() {
        return requestZipFileStatus === ApiStatuses.hookActions.SUCCESS;
    }

    const previousFrameText = useRef((<></>));

    function getButtonText() {
        if (dataPackRestricted) {
            return 'Restricted by Policy';
        }
        const sizeText = (run) ? formatMegaBytes(binaryPrefixConversion(run?.zipfile?.size, 'm'), 1) + ' ' : '';
        const zipText = (<span style={{whiteSpace: 'nowrap'}}>({sizeText}.ZIP)</span>)
        // We do this to prevent the text from rapidly flickering between different states when we fire
        // off a request.
        if (
            (zipAvailableStatus === ApiStatuses.hookActions.FETCHING) ||
            (requestZipFileStatus === ApiStatuses.hookActions.FETCHING)
        ) {
            if (previousFrameText.current === (<></>)) {
                previousFrameText.current = (<>'Processing Zip...'</>);
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
            return (<>DOWNLOAD DATAPACK {zipText}</>);
        }
        if (isZipAvailableResponseBad()) {
            return 'Zip Error';
        }
        if (!isZipProcessing()) {
            return (<>CREATE DATAPACK {zipText}</>);
        }
        return 'Processing Zip...';
    }

    const badResponse = false;

    const buttonText = (<>{getButtonText()}</>);
    previousFrameText.current = buttonText;

    function getPopoverMessage() {
        if (!isRunCompleted()) {
            return 'The DataPack is being built. Downloads will be available for request upon completion.';
        }
        if (isZipAvailableResponseBad()) {
            return 'Could not retrieve zip information, please try again or contact an administrator.';
        }
        if (isRunCanceled()) {
            return (
                <p>
                    The DataPack was canceled or failed during processing, so no zip is available.
                    You can Rerun the DataPack, to generate the files. If you don't have permission
                    to rerun you can clone this DataPack to generate the files.
                </p>
            );
        }
        if (isZipProcessing()) {
            return zipAvailableResponse.data[0].message || 'Processing zip file.';
        }
        return '';
    }

    const popoverText = getPopoverMessage();

    // Whether the button is enabled in a manner that triggers an action (download/POST)
    // This will enable the MUI button, but we also allow clicks
    function shouldEnableButton() {
        if (dataPackRestricted || isRunCanceled()) {
            return false;
        }
        // Check isZipProcessing to be false, because undefined means the call hasn't happened yet.
        return (isRunCompleted() && (!isZipProcessing())) || isZipAvailable();
    }

    const buttonEnabled = shouldEnableButton();

    const [displayCreatingMessage, setDisplayCreatingMessage] = useState(false);

    const getCreatingMessage = () => {

        if (isZipAvailable()) {
            return (<p>
                    DataPack (.ZIP) ready for download.
                </p>
            )
        }
        if (!isRunCompleted() && !isRunCanceled()) {
            return (<p>
                This DataPack is being processed. We will let you know in the notifications panel when it is ready.
            </p>)
        }
        if (isRequestZipFileStatusBad()) {
            return (<p>
                Unable to create your zipfile at this time, please try again or contact an administrator
            </p>);
        }
        return (<p>
            We are creating your zip file. We will let you know in the notifications panel when it is ready.
        </p>);
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
        if (dataPackRestricted || badResponse || isRunCanceled()) {
            // This case controls for when we get no response back at all, usually an empty array.
            // This probably means no file could be retrieved for the specified provider tasks uids combo.
            IconComponent = AlertError;
            iconProps.style = {
                ...iconProps.style,
                fill: colors.warning,
            };
        } else if (!isRunCompleted() ||
            zipAvailableStatus === ApiStatuses.hookActions.FETCHING ||
            isZipProcessing() ||
            buttonText === (<>'Processing Zip...'</>)
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

    async function buttonAction(e: React.MouseEvent<HTMLElement>) {
        // Only post a new zipfile request if there isn't a zip or a successful post yet.
        if (!isZipAvailable()) {
            checkZipAvailable();
        }
        if (dataPackRestricted) {
            setOpen(true);
            return;
        }
        if (!isZipProcessing() && !isRequestZipFileStatusSuccessful() && !isZipAvailable()) {
            postZipRequest();
            setDisplayCreatingMessage(true);
        } else {
            handlePopoverOpen(e);
            clearRequestZipFile();
        }
    }

    function getButton() {
        return (
            <Button
                id="CompleteDownload"
                variant="contained"
                className={`qa-CreateDataPackButton-Button-zipButton`}
                classes={{root: (buttonEnabled) ? classes.button : classes.buttonDisabled}}
                disabled={!buttonEnabled}
                style={{fontSize, lineHeight: 'initial', width: 'max-content'}}
                onClick={(buttonEnabled && isZipAvailable() && !dataPackRestricted)
                    ? (() => window.open(zipAvailableResponse.data[0].url, '_blank'))
                    : buttonAction
                }
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
            </Button>
        );
    }

    return (
        <div style={{display: 'flex'}}>
            <RegionJustification
                providers={props.providerTasks.filter(
                    providerTask => shouldDisplay(providerTask)
                        && providerTask.provider
                        && shouldDisplay(providerTask.provider)
                ).map(providerTask => providerTask.provider)}
                extents={(() => {
                    const extentArray = [];
                    if (props?.job?.extent) {
                        extentArray.push(props?.job?.extent);
                    }
                    return extentArray;
                })()}
                onClose={() => {
                    setDataPackRestricted(true);
                    setOpen(false);
                }}
                onBlockSignal={() => setDataPackRestricted(true)}
                onUnblockSignal={() => setDataPackRestricted(false)}
                display={open}
            />
            <MatomoClickTracker
                eventAction={(isZipAvailable() ? 'Download DataPack' : 'Create DataPack')}
                eventName="DataPack Button"
                eventCategory="Status and Download"
            >
                {getButton()}
            </MatomoClickTracker>
            {renderIf(() => (
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
                            {getCreatingMessage()}
                        </div>
                    </div>
                </CenteredPopup>
            ), displayCreatingMessage)}
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

export default withTheme((withStyles(jss)(CreateDataPackButton)));
