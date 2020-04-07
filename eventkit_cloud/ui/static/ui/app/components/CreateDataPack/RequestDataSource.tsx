import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../common/CustomTableRow";
import axios from "axios";
import CustomTextField from "../common/CustomTextField";
import {createStyles, Theme, withStyles} from "@material-ui/core";
import {useState} from "react";
import {Dispatch} from "react";
import {SetStateAction} from "react";
import {getCookie} from "../../utils/generic";
import {useAsyncRequest, useDebouncedSetter, useDebouncedState, useEffectOnMount} from "../../utils/hooks";

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
            titleStyle={{ margin: '0px' }}
        />
    );
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const csrfmiddlewaretoken = getCookie('csrftoken');

export function RequestDataSource(props: Props) {
    const { open, onClose, classes } = props;

    const [name, debounceName] = useDebouncedState(undefined);
    const [url, debounceUrl] = useDebouncedState(undefined);
    const [layerNames, debounceLayerNames] = useDebouncedState(undefined);
    const [description, debounceDescription] = useDebouncedState(undefined);

    const [{ status, response }, requestCall] = useAsyncRequest();
    const makeRequest = () => requestCall({
        url: `/api/data_provider_requests`,
        method: 'post',
        data: {
            url,
            name,
            service_description: description,
            layer_names: layerNames,
        },
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        cancelToken: source.token,
    });

    function renderMainBody() {
        return (
            <>
                <div
                    id="mainHeading"
                    className={`qa-RequestDataSource-heading ${classes.heading}`}
                >
                    {status !== 'success' ? (<>Please enter TODO</>) : (<>Request successfully submitted.</>)}
                </div>
                <NoFlexRow
                    title="Source name"
                >
                    {status !== 'success' ? (
                            <CustomTextField
                                className={`qa-RequestDataSource-input-name ${classes.textField}`}
                                id="Name"
                                name="sourceName"
                                onChange={(e) => onChange(e, debounceName)}
                                placeholder="Source Name"
                                InputProps={{ className: classes.input }}
                                fullWidth
                                maxLength={100}
                            />) :
                        { name }
                    }
                </NoFlexRow>
                <NoFlexRow
                    title="Source Link"
                >
                    {status !== 'success' ? (<CustomTextField
                            className={`qa-RequestDataSource-input-url ${classes.textField}`}
                            id="url"
                            name="sourceUrl"
                            onChange={(e) => onChange(e, debounceUrl)}
                            placeholder="Source Link"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                        />) :
                        { url }
                    }
                </NoFlexRow>
                <NoFlexRow
                    title="Layer Names"
                >
                    {status !== 'success' ? (<CustomTextField
                            className={`qa-RequestDataSource-input-layers ${classes.textField}`}
                            id="url"
                            name="layerNames"
                            onChange={(e) => onChange(e, debounceLayerNames)}
                            placeholder="Layer1, Layer2, Layer3..."
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                        />) :
                        { layerNames }
                    }
                </NoFlexRow>
                <NoFlexRow
                    title="Description"
                >
                    {status !== 'success' ? (<CustomTextField
                            className={`qa-RequestDataSource-input-description ${classes.textField}`}
                            id="description"
                            name="sourceDescription"
                            onChange={(e) => onChange(e, debounceDescription)}
                            placeholder="Description"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            multiline
                            rows="4"
                            maxLength={1000}
                        />) :
                        { description }
                    }
                </NoFlexRow>
            </>
        )
    }

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
            {(true) && (renderMainBody())}
            {status === 'pending' && (
                <div>Submitting request...</div>
            )}
            {status === 'error' && (
                <div>Error message</div>
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
