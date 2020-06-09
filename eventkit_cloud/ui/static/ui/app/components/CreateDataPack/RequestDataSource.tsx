import BaseDialog from "../Dialog/BaseDialog";
import * as React from 'react';
import Button from "@material-ui/core/Button";
import CustomTableRow from "../common/CustomTableRow";
import CustomTextField from "../common/CustomTextField";
import {CircularProgress, createStyles, Theme, withStyles, withTheme} from "@material-ui/core";
import {useEffect} from "react";
import {getCookie} from "../../utils/generic";
import {
    useAccessibleRef,
    useDebouncedState,
} from "../../utils/hooks/hooks";
import {isWidthUp} from "@material-ui/core/withWidth";
import withWidth from "@material-ui/core/withWidth/withWidth";
import {Breakpoint} from "@material-ui/core/styles/createBreakpoints";
import {useAsyncRequest} from "../../utils/hooks/api";

interface Props {
    open: boolean;
    onClose: () => void;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
    width: Breakpoint;
}

function NoFlexRow(props: React.PropsWithChildren<any>) {
    return (
        <CustomTableRow
            {...props}
            dataStyle={{ ...props.dataStyle, display: 'block', padding: '0px' }}
        />
    );
}

export function RequestDataSource(props: Props) {
    const { open, onClose, width, classes } = props;

    const [name, debounceName] = useDebouncedState(null);
    const [url, debounceUrl] = useDebouncedState(null);
    const [layerNames, debounceLayerNames] = useDebouncedState(null);
    const [description, debounceDescription] = useDebouncedState(null);
    // Special state variable that uses a ref and a functional getter so that the value can be updated
    // and set in the same frame. Changes to this DO trigger re-renders, unlike normal ref change.
    const [shouldValidate, setShouldValidate] = useAccessibleRef(false);

    const isSmallScreen = () => !isWidthUp('sm', width);

    // Helper object, maps the field options to their value, setter, and a property
    // indicating whether it should be required. Removes the need to manually keep track of what is required
    // in various locations and allows for a reduction of boilerplate props being added manually.
    const fieldMap = {
        name: {
            value: name,
            setter: debounceName,
            required: true,
        },
        url: {
            value: url,
            setter: debounceUrl,
            required: true,
        },
        layerNames: {
            value: layerNames,
            setter: debounceLayerNames,
            required: false,
        },
        description: {
            value: description,
            setter: debounceDescription,
            required: false,
        },
    };

    const [{ status, response }, requestCall, clearRequest] = useAsyncRequest();
    const makeRequest = () => {
        // User clicks the submit button, inform the UI to start displaying validation.
        setShouldValidate(true);
        if (!isSubmitValid()) {
            // Exit early if the submission isn't valid.
            return;
        }
        // Returned promise is ignored, we don't need it.
        requestCall({
            url: `/api/providers/requests`,
            method: 'post',
            data: {
                url,
                name,
                service_description: description,
                layer_names: layerNames,
            },
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        });
    };

    // Clear text boxes when closed.
    useEffect(() => {
        debounceName('');
        debounceUrl('');
        debounceLayerNames('');
        debounceDescription('');
        setShouldValidate(false);
        clearRequest();
    }, [open]);

    function validate(value, required) {
        // We don't want to validate until a user has tried to submit.
        if (!shouldValidate()) {
            return true;
        }
        return (!!value && value.length > 0) || !required;
    }

    function renderMainBody() {
        const infoMessage = "Please provide a link to the service and the specific layers that you need." +
            "  Additionally please provide a description of the service, if the link does not provide one.";
        const getDisplayProps = (field) => {
            const submitted = status === 'success';
            const displayValue = field.value;
            return {
                value: (submitted) ? displayValue || ' ' : undefined,
                disabled: submitted,
                error: !validate(displayValue, field.required),
                onChange: (e) => field.setter(e.target.value),
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
                    className={`qa-RequestDataSource-heading ${classes.heading} ${status ? classes.submittedHeading : ''}`}
                >
                    {status !== 'success' ? infoMessage : (
                        <>
                            <p>
                                Request successfully submitted.
                            </p>
                            <p>
                                We will notify you with a status/resolution.
                            </p>
                        </>
                    )}
                </div>
                {/*The conditional can be removed here if we want to show a user what data they submitted.*/}
                {status !== 'success' && (<>
                    <div className={classes.entryRow}>
                        <strong className={classes.left}>Source Name:</strong>
                        <div className={classes.right}>
                            <CustomTextField
                                id="name"
                                name="sourceName"
                                placeholder="source name"
                                {...sharedProps}
                                {...getDisplayProps(fieldMap.name)}
                            />
                        </div>
                    </div>
                    <div className={classes.entryRow}>
                        <strong className={classes.left}>Source Link:</strong>
                        <div className={classes.right}>
                            <CustomTextField
                                id="url"
                                name="sourceUrl"
                                placeholder="source link"
                                {...sharedProps}
                                {...getDisplayProps(fieldMap.url)}
                            />
                        </div>
                    </div>
                    <div className={classes.entryRow}>
                        <strong className={classes.left}>Layer(s) Needed:</strong>
                        <div className={classes.right}>
                            <CustomTextField
                                id="layerNames"
                                name="layerNames"
                                placeholder="layer1, layer2, layer3..."
                                {...sharedProps}
                                {...getDisplayProps(fieldMap.layerNames)}
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
                                // Current version of MUI seems to size the text field differently when it's multilined
                                // This style overrides some child styles to bring it in line with the other components.
                                inputProps={{ className: classes.innerInput }}
                                rows={4}
                                rowsMax={4}
                                multiline
                                {...sharedProps}
                                {...getDisplayProps(fieldMap.description)}
                                maxLength={1000}  // Overwrites maxLength in sharedProps
                            />
                        </div>
                    </div>
                </>)}
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

    function isSubmitValid() {
        // Get keys of all fields that are required (required === true)
        const required = Object.keys(fieldMap).filter(key => fieldMap[key].required);
        // Run each required field, via the required keys, through the validate function with required set to true
        // Then check if EVERY result in the array is true, return the result (true/false)
        return required.map(key => validate(fieldMap[key].value, true)).every(value => value)
    }

    function getDialogProps() {
        const dialogProps = {};
        if (!isSmallScreen()) {
            dialogProps['innerMaxHeight'] = 600;
        } else {
            dialogProps['bodyProps'] = { className: classes.dialog };
            dialogProps['dialogStyle'] = {
                width: '95%',
                maxHeight: '90%',
                margin: '10px',
            }
        }
        if (!status) {
            // Status is undefined, meaning we haven't submitted anything yet, so we need the submit button to display
            dialogProps['actions'] = [(
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
            // When we pass undefined to the basedialog, it will use the default 'Close' button that we want
            dialogProps['actionsStyle'] = {
                paddingTop: '15px',
                margin: 'auto',
                flexDirection: 'initial',
                justifyContent: 'initial',
                paddingBottom: '20px',
            }
        }
        return dialogProps;
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
            {...getDialogProps()}
        >
            <div className={`${!isSmallScreen() ? classes.outerContainer : classes.outerContainerSm}`}>
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
        borderStyle: 'solid',
        borderWidth: '1px',
        borderRadius: '4px',
        padding: '12px',
        margin: '5px',
    },
    outerContainerSm: {
        paddingRight: '15px',
    },
    dialog: {
        borderStyle: 'solid',
        borderWidth: '1px',
        padding: '0 12px',
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
    },
    submittedHeading: {
        paddingBottom: '0px',
        display: 'flex',
        justifyContent: 'center'
    },
    entryRow: {
        paddingBottom: '10px',
        display: 'flex',
        flexWrap: 'wrap',
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


export default withWidth()(withTheme()(withStyles(jss)(RequestDataSource)));
