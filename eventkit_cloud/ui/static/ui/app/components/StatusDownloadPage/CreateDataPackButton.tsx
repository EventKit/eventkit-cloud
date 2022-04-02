import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest, ApiStatuses, FileStatus} from "../../utils/hooks/api";
import {binaryPrefixConversion, formatMegaBytes, getCookie, shouldDisplay} from "../../utils/generic";
import {useRunContext} from "./context/RunFile";
import {useEffect, useRef, useState} from "react";
import {DepsHashers} from "../../utils/hooks/hooks";
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
    iconButtonEnabled: {
        fill: theme.eventkit.colors.primary,
        verticalAlign: 'middle', marginRight: '5px',
    },
    iconButtonAlert: {
        fill: theme.eventkit.colors.warning,
        verticalAlign: 'middle', marginRight: '5px',
    },
    iconButtonDisabled: {
        fill: theme.eventkit.colors.white,
        color: theme.eventkit.colors.primary,
        verticalAlign: 'middle', marginRight: '5px',
    },
});

const enum ButtonStates {
    POLICY_RESTRICTED,
    RUN_CANCELED,
    JOB_PROCESSING,
    ZIP_AVAILABLE,
    ZIP_ERROR,
    JOB_FAILED,
    ZIP_PROCESSING,
    CREATE_DATAPACK
}

interface Props {
    fontSize: string;  // Pass through font size to be consistent with parent.
    classes: { [className: string]: string; };
    providerTasks: Eventkit.ProviderTask[];
    job: Eventkit.Job;
    theme: Eventkit.Theme & Theme;
}

export function CreateDataPackButton(props: Props) {
    const {fontSize, providerTasks, classes} = props;
    const {run} = useRunContext();

    const [buttonEnabled, setButtonEnabled] = useState(false);
    const [buttonState, setButtonState] = useState(ButtonStates.CREATE_DATAPACK)
    const [buttonText, setButtonText] = useState('');
    const [creatingMessage, setCreatingMessage] = useState('');
    const [displayCreatingMessage, setDisplayCreatingMessage] = useState(false);
    const [IconComponent, setIconComponent] = useState(<CloudDownload className={classes.iconButtonEnabled}/>);
    const [popoverText, setPopoverText] = useState('');
    const [open, setOpen] = useState(true);
    const [dataPackRestricted, setDataPackRestricted] = useState(false);
    const [anchor, setAnchor] = useState(null);

    const cancelFailurePopoverMsg = "The DataPack was canceled or failed during processing, so no zip is available." +
        "You can Rerun the DataPack, to generate the files. If you don't have permission" +
        "to rerun you can clone this DataPack to generate the files."

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
        updateButtonState();
    }, [zipAvailableResponse, run.status, dataPackRestricted])

    useEffect(() => {
        updateButtonProperties()
    }, [buttonState])

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

    function isRunFailed() {
        return run.status === ApiStatuses.files.FAILED;
    }

    function isRunIncomplete() {
        return run.status === ApiStatuses.files.INCOMPLETE;
    }

    function zipResponseExists() {
        return zipAvailableResponse.data && zipAvailableResponse.data.length &&
            zipAvailableResponse.data[0].status
    }

    function isZipProcessing() {
        // Return true when the zip is available and in some kind of state that indicates it will be available
        // after a period of processing (pending or running)
        return (zipResponseExists() && (
                ApiStatuses.inProgressStates.includes(zipAvailableResponse.data[0].status as FileStatus)
            ));
    }

    function isZipAvailable() {
        return zipResponseExists() && zipAvailableResponse.data[0].status === ApiStatuses.files.SUCCESS;
    }

    function isZipResponseBad() {
        return zipResponseExists() && zipAvailableResponse.data[0].status === ApiStatuses.files.FAILED;
    }

    function isRequestZipFileStatusBad() {
        return requestZipFileStatus === ApiStatuses.hookActions.ERROR;
    }

    function isRequestZipFileStatusSuccessful() {
        return requestZipFileStatus === ApiStatuses.hookActions.SUCCESS;
    }

    const previousFrameText = useRef((<></>));

    function updateButtonState() {
        if (dataPackRestricted) {
            setButtonState(ButtonStates.POLICY_RESTRICTED)
        } else if (isRunCanceled()) {
            setButtonState(ButtonStates.RUN_CANCELED)
        } else if (!isRunCompleted()) {
            setButtonState(ButtonStates.JOB_PROCESSING)
        } else if (isZipAvailable()) {
            setButtonState(ButtonStates.ZIP_AVAILABLE)
        }else if (isZipResponseBad()) {
            setButtonState(ButtonStates.ZIP_ERROR)
        } else if (!isZipProcessing()) {
            if (isRunFailed() || isRunIncomplete()) {
                setButtonState(ButtonStates.JOB_FAILED)
            } else {
                // This state is when a datapack has been shared with a user who
                // doesn't have access to all the providers in the datapack
                setButtonState(ButtonStates.CREATE_DATAPACK)
            }
        } else {
            setButtonState(ButtonStates.ZIP_PROCESSING)
        }
    }

    function getZipText() {
        const sizeText = (run) ? formatMegaBytes(binaryPrefixConversion(run?.zipfile?.size, 'm'), 1) + ' ' : '';
        return `(${sizeText}.ZIP)`
    }

    function updateButtonProperties() {
         switch (buttonState) {
            case ButtonStates.POLICY_RESTRICTED:
                setButtonText('Restricted by Policy');
                setPopoverText(
                        'You do not have access to this datapack due to security policy restrictions.' +
                        'Please contact an administrator if you believe you should have access to this datapack.'
                );
                setButtonEnabled(false);
                setCreatingMessage('')
                setIconComponent(<AlertError className={classes.iconButtonAlert}/>);
                break;
            case ButtonStates.RUN_CANCELED:
                setButtonText('Zip Canceled');
                setPopoverText(cancelFailurePopoverMsg);
                setButtonEnabled(false);
                setCreatingMessage('Unable to create your zipfile at this time, please try again or contact an administrator');
                setIconComponent(<AlertError className={classes.iconButtonAlert}/>);
                break;
            case ButtonStates.JOB_PROCESSING:
                setButtonText('Job Processing...')
                setPopoverText('The DataPack is being built. Downloads will be available for request upon completion.')
                setButtonEnabled(false);
                setCreatingMessage(
                    'This DataPack is being processed. We will let you know in the notifications panel when it is ready.'
                )
                setIconComponent(<CircularProgress className={classes.iconButtonEnabled} size={18}/>);
                break;
            case ButtonStates.ZIP_AVAILABLE:
                setButtonText(`DOWNLOAD DATAPACK ${getZipText()}`)
                setPopoverText('')
                setButtonEnabled(true);
                setCreatingMessage('DataPack (.ZIP) ready for download')
                setIconComponent(<CloudDownload className={classes.iconButtonEnabled}/>);
                break;
            case ButtonStates.ZIP_ERROR:
                setButtonText('Zip Error')
                setPopoverText('Could not retrieve zip information, please try again or contact an administrator.')
                setButtonEnabled(false);
                setCreatingMessage(
                    'Unable to create your zipfile at this time, please try again or contact an administrator'
                )
                setIconComponent(<AlertError className={classes.iconButtonAlert}/>);
                break;
            case ButtonStates.JOB_FAILED:
                setButtonText('Job Failed')
                setPopoverText(cancelFailurePopoverMsg);
                setButtonEnabled(false);
                setCreatingMessage(
                    'Unable to create your zipfile at this time, please try again or contact an administrator'
                )
                setIconComponent(<AlertError className={classes.iconButtonAlert}/>);
                break;
             case ButtonStates.ZIP_PROCESSING:
                setButtonText('Processing Zip...')
                setPopoverText(zipAvailableResponse.data[0].message || 'Processing zip file.')
                setButtonEnabled(false);
                setCreatingMessage(
                    'We are creating your zip file. We will let you know in the notifications panel when it is ready.'
                )
                setIconComponent(<CircularProgress className={classes.iconButtonEnabled} size={18}/>);
                break;
            case ButtonStates.CREATE_DATAPACK:
                setButtonText('CREATE DATAPACK')
                setPopoverText('')
                setButtonEnabled(true);
                setCreatingMessage('')
                setIconComponent(<CloudDownload className={classes.iconButtonEnabled}/>);
                break;
            default:
                setButtonText('CREATE DATAPACK')
                setPopoverText('')
                setButtonEnabled(false);
                setCreatingMessage('')
                setIconComponent(<CloudDownload className={classes.iconButtonEnabled}/>);
         }
    }

    previousFrameText.current = (<>buttonText</>);

    async function buttonAction(e: React.MouseEvent<HTMLElement>) {
        switch (buttonState) {
            case ButtonStates.ZIP_AVAILABLE:
                window.open(zipAvailableResponse.data[0].url, '_blank')
                return;
            case ButtonStates.POLICY_RESTRICTED:
                setOpen(true);
                return;
        }
        // Only post a new zipfile request if there isn't a zip or a successful post yet.
        if (!isZipAvailable()) {
            checkZipAvailable();
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
                onClick={buttonAction}
            >
                {!buttonEnabled && (
                    // This div is placed over top of the main button when it is disabled.
                    // It then acts as a button that allows users to open popovers.
                    // This allows us to leverage the built in disabled functionality on the MUI component
                    // while still being able to click the button. MUI stops all onClick events when disabled.
                    <div onClick={buttonAction} className={classes.fakeButton}
                         id="qa-CreateDataPackButton-fakeButton"/>
                )}
                {IconComponent}
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
                eventAction={(buttonState === ButtonStates.ZIP_AVAILABLE ? 'Download DataPack' : 'Create DataPack')}
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
                            <>{creatingMessage}</>
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
                    For convenience, EventKit bundles all the individual data products into a single
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
