import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import withWidth, {isWidthUp} from "@material-ui/core/withWidth";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest, ApiStatuses} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";
import {useRunContext} from "./RunFileContext";
import {useEffect} from "react";
import {DepsHashers, usePrevious} from "../../utils/hooks/hooks";
import axios from "axios";
import {CircularProgress} from "@material-ui/core";

const jss = (theme: Eventkit.Theme & Theme) => ({
    btn: {
        backgroundColor: theme.eventkit.colors.selected_primary,
        color: theme.eventkit.colors.primary,
        fontWeight: 'bold' as 'bold',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary_dark,
            color: theme.eventkit.colors.primary,
        },
        '&:disabled': {
            backgroundColor: theme.eventkit.colors.secondary_dark,
            color: theme.eventkit.colors.grey,
        },
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

    useEffect(() => {
        let timeoutId;
        if (zipAvailableStatus === ApiStatuses.hookActions.NOT_FIRED) {
            checkZipAvailable();
        } else {
            if (zipAvailableStatus === ApiStatuses.hookActions.SUCCESS &&
                requestZipFileStatus !== ApiStatuses.hookActions.NOT_FIRED &&
                !isZipAvailable()) {
                timeoutId = setTimeout(() => {
                    checkZipAvailable();
                }, 5000);
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
        if (!!zipAvailableResponse && zipAvailableResponse.status === 'PENDING' || zipAvailableStatus === ApiStatuses.hookActions.FETCHING) {
            return 'Processing Zip...'
        }
        return 'CREATE DATAPACK (.ZIP)';
    }

    function shouldEnableButton() {
        if (isZipAvailable()) {
            return true;
        }
        return isRunCompleted() && requestZipFileStatus === ApiStatuses.hookActions.NOT_FIRED;
    }

    async function buttonAction() {
        if (!isZipAvailable()) {
            postZipRequest();
            clearZipAvailable();
        }
    }

    const buttonEnabled = shouldEnableButton();

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
                style: {fill: colors.grey},
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
        if (!isRunCompleted() || !isZipAvailable()) {
            Component = CircularProgress;
        }
        return (
            <Component
                {...iconProps}
            />
        );
    }

    return (
        <>
            <Button
                id="CompleteDownload"
                variant="contained"
                className="qa-DataPackDetails-Button-zipButton"
                classes={{root: classes.btn}}
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
                {getCloudDownloadIcon()}
                {getButtonText()}

            </Button>
            <InfoDialog
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
        </>
    )
}

export default withWidth()(withTheme()(withStyles(jss)(CreateDataPackButton)));