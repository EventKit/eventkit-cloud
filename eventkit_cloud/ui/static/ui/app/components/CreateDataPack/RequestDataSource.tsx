import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../common/CustomTableRow";
import axios from "axios";
import CustomTextField from "../common/CustomTextField";
import {createStyles, Theme, withStyles, withTheme} from "@material-ui/core";
import {useState} from "react";
import {Dispatch} from "react";
import {SetStateAction} from "react";
import {getCookie} from "../../utils/generic";
import {useAsyncRequest, useDebouncedSetter, useDebouncedState, useEffectOnMount} from "../../utils/hooks";

interface Props {
    open: boolean;
    onClose: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

function NoFlexRow(props: React.PropsWithChildren<any>) {
    return (
        <CustomTableRow
            {...props}
            // titleStyle={{padding: '0px'}}
            dataStyle={{ ...props.dataStyle, display: 'block', padding: '0px' }}
        />
    );
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const csrfmiddlewaretoken = getCookie('csrftoken');

export function RequestDataSource(props: Props) {
    const { open, onClose, classes } = props;

    const [name, debounceName] = useDebouncedState(undefined);
    const [url, debounceUrl] = useDebouncedState('');
    const [layerNames, debounceLayerNames] = useDebouncedState('');
    const [description, debounceDescription] = useDebouncedState('');

    const [{ status, response }, requestCall] = useAsyncRequest();
    const makeRequest = () => requestCall({
        url: `/api/providers/requests`,
        method: 'post',
        data: {
            url,
            name,
            service_description: description,
            layer_names: `[${layerNames}]`,
        },
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        cancelToken: source.token,
    });

    function renderMainBody() {
        const infoMessage = "Please provide as much detail as possible. If you have a link to the website that" +
            "hosts the map and any detail about the layers you need, please include that information in this request.";
        return (
            <>
                <div
                    id="mainHeading"
                    className={`qa-RequestDataSource-heading ${classes.heading}`}
                >
                    {status !== 'success' ? infoMessage : "Request successfully submitted"}
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Source Name:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            className={classes.textField}
                            id="name"
                            name="sourceName"
                            onChange={e => onChange(e, debounceName)}
                            placeholder="enter source here"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                            variant="outlined"
                            disabled={status === 'success'}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Source Name:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            className={classes.textField}
                            id="url"
                            name="sourceUrl"
                            onChange={(e) => onChange(e, debounceUrl)}
                            placeholder="enter url here"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                            variant="outlined"
                            disabled={status === 'success'}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Source Name:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            className={classes.textField}
                            id="layerNames"
                            name="layerNames"
                            onChange={(e) => onChange(e, debounceLayerNames)}
                            placeholder="layer1, layer2, layer3..."
                            InputProps={{ className: classes.input }}
                            fullWidth
                            maxLength={256}
                            variant="outlined"
                            disabled={status === 'success'}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Source Name:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            className={classes.textField}
                            id="description"
                            name="description"
                            onChange={(e) => onChange(e, debounceDescription)}
                            placeholder="enter description here"
                            InputProps={{ className: classes.input }}
                            fullWidth
                            variant="outlined"
                            disabled={status === 'success'}
                            maxLength={1000}
                            rows={4}
                            rowsMax={4}
                            multiline
                        />
                    </div>
                </div>
            </>
        )
    }

    function renderErrorMessage() {
        const { data = { errors: [] } } = !!response ? response.response : {};
        return (
            <>
                <div
                    className={`qa-RequestDataSource-error-message ${classes.heading}`}
                >
                    Request failure.
                </div>
                {data.errors.map((error, ix) => (
                    <NoFlexRow
                        key={ix}
                        title={error.title}
                    >
                        {error.detail}
                    </NoFlexRow>
                ))}
            </>
        );
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
            innerMaxHeight={600}
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
            <div className={classes.outerContainer}>
                {(!status || status === 'success') && renderMainBody()}
                {status === 'pending' && (
                    <div>Submitting request...</div>
                )}
                {status === 'error' && renderErrorMessage()}
            </div>
        </BaseDialog>
    );
}

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    outerContainer: {
        padding: '15px',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderRadius: '4px',
    },
    input: {
        fontSize: '16px',
        paddingLeft: '5px',
        paddingRight: '50px',
    },
    heading: {
        paddingBottom: '15px',
        display: 'flex',
        flexWrap: 'wrap',
        lineHeight: '17px',
    },
    entryRow: {
        paddingBottom: '10px',
        display: 'flex',
    },
    left: {
        width: '150px',
        paddingTop: '10px',
        flexGrow: 1,
    },
    right: {
        flexGrow: 5,
    },
    textField: {
        backgroundColor: theme.eventkit.colors.white,
    },
});


export default withTheme()(withStyles(jss)(RequestDataSource));
