import Button from "@material-ui/core/Button";
import * as React from "react";
import InfoDialog from "../Dialog/InfoDialog";
import {Theme, withStyles, withTheme} from "@material-ui/core/styles";
import withWidth, {isWidthUp} from "@material-ui/core/withWidth";
import CloudDownload from "@material-ui/icons/CloudDownload";
import {useAsyncRequest} from "../../utils/hooks/api";
import {getCookie} from "../../utils/generic";

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
    zipFileProp: string;
    classes: { [className: string]: string; }
    providerTaskUids: string[];
    theme: Eventkit.Theme & Theme;
}


function CreateDataPackButton(props: Props) {
    const {fontSize, providerTaskUids, classes, theme} = props;

    const [{ status: zipAvailableStatus, response: zipAvailableResponse }, zipAvailAbleCall, clearZipAvailable] = useAsyncRequest();
    const checkZipAvailable = () => {
        // Returned promise is ignored, we don't need it.
        zipAvailAbleCall({
            // url: `/api/providers/requests`,
            url: props.zipFileProp,
            method: 'GET',
            // data: {
            //     uids: providerTaskUids,
            // },
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        });
    };

    function isZipAvailable() {
        return !!zipAvailableStatus && zipAvailableStatus === 'success'
    }

    // const [{ zipRequestStatus, zipRequestReponse }, zipRequestCall, clearZipRequest] = useAsyncRequest();
    // const requestZip = () => {
    //     // Returned promise is ignored, we don't need it.
    //     zipAvailAbleCall({
    //         url: `/api/providers/requests`,
    //         method: 'GET',
    //         data: {
    //             uids: providerTaskUids,
    //         },
    //         headers: { 'X-CSRFToken': getCookie('csrftoken') },
    //     });
    // };

    function getCloudDownloadIcon() {
        const {colors} = theme.eventkit;
        if (false) {
            return (
                <CloudDownload
                    className="qa-DataPackDetails-CloudDownload-disabled"
                    style={{fill: colors.grey, verticalAlign: 'middle', marginRight: '5px'}}
                />
            );
        }
        return (
            <CloudDownload
                className="qa-DataPackDetails-CloudDownload-enabled"
                style={{fill: colors.primary, verticalAlign: 'middle', marginRight: '5px'}}
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
                disabled={false}
                style={{fontSize: fontSize, lineHeight: 'initial'}}
                onClick={() => checkZipAvailable()}
            >
                {getCloudDownloadIcon()}
                {false ? 'DOWNLOAD DATAPACK (.ZIP)' : 'CREATING DATAPACK ZIP'}

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