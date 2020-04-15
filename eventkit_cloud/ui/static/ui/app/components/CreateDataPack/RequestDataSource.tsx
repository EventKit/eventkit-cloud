import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../common/CustomTableRow";
import axios from "axios";
import CustomTextField from "../common/CustomTextField";
import {CircularProgress, createStyles, Theme, withStyles, withTheme} from "@material-ui/core";
import {useEffect, useState} from "react";
import {Dispatch} from "react";
import {SetStateAction} from "react";
import {getCookie} from "../../utils/generic";
import {
    useAccessibleRef,
    useAsyncRequest,
    useDebouncedSetter,
    useDebouncedState,
    useEffectOnMount
} from "../../utils/hooks";

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
            dataStyle={{ ...props.dataStyle, display: 'block', padding: '0px' }}
        />
    );
}

const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const csrfmiddlewaretoken = getCookie('csrftoken');

export function RequestDataSource(props: Props) {
    const { open, onClose, classes } = props;

    useEffect(() => {
        debounceName('');
        debounceUrl('');
        debounceLayerNames('');
        debounceDescription('');
    }, [open]);

    const [name, debounceName] = useDebouncedState(null);
    const [url, debounceUrl] = useDebouncedState(null);
    const [layerNames, debounceLayerNames] = useDebouncedState(null);
    const [description, debounceDescription] = useDebouncedState(null);
    const [shouldValidate, setShouldValidate] = useAccessibleRef(false);

    const [{ status, response }, requestCall] = useAsyncRequest();
    const makeRequest = () => {
        setShouldValidate(true);
        if (!isSubmitValid()) {
            return;
        }
        requestCall({
            url: `/api/providers/requests`,
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
    };

    function validate(value, required) {
        // We don't want to validate until a user has tried to submit.
        if (!shouldValidate()) {
            return true;
        }
        return (!!value && value.length > 0) || !required;
    }

    function renderMainBody() {
        const infoMessage = "Please provide as much detail as possible. If you have a link to the website that " +
            "hosts the map and any detail about the layers you need, please include that information in this request.";
        const getDisplayProps = (displayValue, required) => {
            const submitted = status === 'success';
            return {
                value: (submitted) ? displayValue : undefined,
                disable: submitted ,
                error: !validate(displayValue, required),
            }
        };
        const sharedProps = {
            autoComplete: "off",
            className: classes.textField,
            InputProps: { className: classes.input },
            fullWidth: true,
            maxLength: 100,
            variant: "outlined" as "outlined",
        };
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

                            id="name"
                            name="sourceName"
                            placeholder="source name"
                            onChange={e => onChange(e, debounceName)}
                            {...sharedProps}
                            {...getDisplayProps(name, true)}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Source URL:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            id="url"
                            name="sourceUrl"
                            placeholder="source url"
                            onChange={(e) => onChange(e, debounceUrl)}
                            {...sharedProps}
                            {...getDisplayProps(url, true)}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Layer Names:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            id="layerNames"
                            name="layerNames"
                            placeholder="layer1, layer2, layer3..."
                            onChange={(e) => onChange(e, debounceLayerNames)}
                            {...sharedProps}
                            {...getDisplayProps(layerNames, true)}
                        />
                    </div>
                </div>
                <div className={classes.entryRow}>
                    <strong className={classes.left}>Description:</strong>
                    <div className={classes.right}>
                        <CustomTextField
                            id="description"
                            name="description"
                            placeholder="enter description here"
                            inputProps={{ className: classes.innerInput }}
                            rows={4}
                            rowsMax={4}
                            multiline
                            onChange={(e) => onChange(e, debounceDescription)}
                            {...sharedProps}
                            {...getDisplayProps(description, false)}
                            maxLength={1000}
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

    function isSubmitValid() {
        return [
            validate(name, true),
            validate(url, true),
            validate(layerNames, true),
        ].every(value => value)
    }

    function getAction() {
        if (!status) {
            return [(
                <Button
                    key="close"
                    variant="contained"
                    color="primary"
                    disabled={!isSubmitValid}
                    onClick={makeRequest}
                >
                    Submit
                </Button>
            )];
        } else {
            return undefined;
        }
    }

    if (!open) {
        return null;
    }
    return (
        <BaseDialog
            show
            title="Request New Data Source"
            onClose={onClose}
            titleStyle={{ padding: '12px 24px' }}
            innerMaxHeight={600}
            actions={getAction()}
        >
            <div className={classes.outerContainer}>
                {(!status || status === 'success') && renderMainBody()}
                {status === 'pending' && (
                    <CircularProgress size={50}/>
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
        padding: '0px'
    },
    innerInput: {
        padding: '18.5px 14px'
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
