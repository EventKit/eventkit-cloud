import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../CustomTableRow";
import axios from "axios";
import CustomTextField from "../CustomTextField";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import {useState} from "react";
import {Dispatch} from "react";
import {SetStateAction} from "react";
import {getCookie} from "../../utils/generic";
import {useAsyncRequest, useDebouncedSetter, useEffectOnMount} from "../../utils/hooks";

interface Props {
    open: boolean;
    onClose: () => void;
    classes: { [className: string]: string };
}

function NoFlexRow(props: React.PropsWithChildren<any>) {
    return (
        <CustomTableRow
            {...props}
            dataStyle={{ display: 'block', padding: '0px' }}
            titleStyle={{ padding: '0px' }}
        />
    );
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const csrfmiddlewaretoken = getCookie('csrftoken');

export function RequestDataSource(props: Props) {
    const { open, onClose, classes } = props;

    const [{ status, response }, makeRequest] = useAsyncRequest({
        url: `/api/providers`,
        method: 'get',
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        cancelToken: source.token,
    });
    const [name, setName] = useState(undefined);
    const [url, setUrl] = useState(undefined);
    const [description, setDescription] = useState(undefined);
    const [layerNames, setLayerNames] = useState(undefined);
    const nameDebouncer = useDebouncedSetter(setName);

    function onChange(e: any, setter: Dispatch<SetStateAction<any>>) {
        setter(e.target.value);
    }

    if (!open) {
        return null;
    }
    return (
        <BaseDialog
            show
            title="Request Data Source"
            onClose={onClose}
            actions={[(
                <Button
                    key="close"
                    variant="contained"
                    color="primary"
                    onClick={makeRequest}
                >
                    Submit
                </Button>
            )]}
        >
            {!status && (
                <>
                    <div
                        id="mainHeading"
                        className={`qa-RequestDataSource-heading ${classes.heading}`}
                    >
                        Info description placeholder.
                    </div>
                    <NoFlexRow
                        title="Source name"
                    >
                        <CustomTextField
                            className={`qa-RequestDataSource-input-name ${classes.textField}`}
                            id="Name"
                            name="sourceName"
                            onChange={(e) => onChange(e, nameDebouncer)}
                            placeholder="Source Name"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={100}
                        />
                    </NoFlexRow>
                    <NoFlexRow
                        title="Source Link"
                    >
                        <CustomTextField
                            className={`qa-RequestDataSource-input-url ${classes.textField}`}
                            id="url"
                            name="sourceUrl"
                            onChange={(e) => onChange(e, setUrl)}
                            placeholder="Source Link"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                        />
                    </NoFlexRow>
                    <NoFlexRow
                        title="Layer Names"
                    >
                        <CustomTextField
                            className={`qa-RequestDataSource-input-layers ${classes.textField}`}
                            id="url"
                            name="layerNames"
                            onChange={(e) => onChange(e, setLayerNames)}
                            placeholder="Layer1, Layer2, Layer3..."
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                        />
                    </NoFlexRow>
                    <NoFlexRow
                        title="Description"
                    >
                        <CustomTextField
                            className={`qa-RequestDataSource-input-description ${classes.textField}`}
                            id="description"
                            name="sourceDescription"
                            onChange={(e) => onChange(e, setDescription)}
                            placeholder="Description"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            multiline
                            rows="4"
                            maxLength={1000}
                        />
                    </NoFlexRow>
                </>
            )}
            {status && !!response(
                <div>
                    {response.data.toString()}
                </div>
            )}
        </BaseDialog>
    );
}

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    textField: {
        backgroundColor: theme.eventkit.colors.secondary,
    },
    input: {
        fontSize: '16px',
        paddingLeft: '5px',
        paddingRight: '50px',
    },
    heading: {
        fontSize: '18px',
        fontWeight: 'bold',
        paddingBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
        lineHeight: '25px',
    },
});


export default withStyles(jss)(RequestDataSource);
