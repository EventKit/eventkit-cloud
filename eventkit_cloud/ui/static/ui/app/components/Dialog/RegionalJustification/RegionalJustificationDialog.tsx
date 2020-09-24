import * as React from 'react';
import {
    withTheme, withStyles, createStyles, Theme,
} from '@material-ui/core/styles';
import withWidth, {isWidthUp} from '@material-ui/core/withWidth';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import {Button, CircularProgress, TextField} from '@material-ui/core';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {useEffect, useState} from 'react';
import BaseDialog from '../BaseDialog';
import Collapse from "@material-ui/core/Collapse";
import CustomTextField from "../../common/CustomTextField";
import Radio from "@material-ui/core/Radio";
import {ApiStatuses, useAsyncRequest} from "../../../utils/hooks/api";
import TextLabel from "./TextLabel";
import JustificationDropdown from "./JustificationDropdown";
import {getCookie} from "../../../utils/generic";


const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    container: {
        display: 'flex',
        width: '100%',
    },
    dialog: {
        borderStyle: 'solid',
        borderWidth: '1px',
        padding: '12px',
        borderRadius: '4px',
    },
    expand: {
        display: 'flex',
        flex: '0 0 auto',
        float: 'right',
    },
    outerContainer: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderRadius: '4px',
        padding: '12px',
    },
    outerContainerSm: {
        paddingRight: '15px',
    },
    textField: {
        marginTop: '15px',
        backgroundColor: theme.eventkit.colors.secondary,
    },
    justificationOption: {
        display: 'flex',
        marginBottom: '10px',
    },
    policyCollapse: {
        color: theme.eventkit.colors.black,
        backgroundColor: theme.eventkit.colors.primary_background,
        padding: '10px',
        marginBottom: '15px',
    },
    hidden: {display: 'none'},
    policyCollapseHeader: {
        paddingBottom: '10px',
    },
    checkbox: {
        width: '24px',
        height: '24px',
        marginRight: '5px',
        flex: '0 0 auto',
        color: theme.eventkit.colors.primary,
        '&$checked': {
            color: theme.eventkit.colors.success,
        },
    },
    checked: {},
    okayButtonContainer: {
        display: 'flex',
        marginBottom: '10px',
    },
    okayButton: {
        margin: 'auto',
    },
    cancelAndExitButton: {
        lineHeight: 'inherit',
        fontSize: '1em',
        height: 'auto',
        whiteSpace: 'nowrap',
        [theme.breakpoints.down('md')]: {
            whiteSpace: 'initial',
            padding: '5px',
        },
        [theme.breakpoints.down('sm')]: {
            fontSize: '0.9em',
        },
    },
});

// Remove this once the real renderIf gets added -- currently only in master, not feature branch
export function renderIf(callback, bool) {
    return (bool) ? callback() : null;
}

export interface RegionalJustificationDialogPropsBase {
    isOpen: boolean;
    onSubmit?: () => void;
    onClose: () => void;
}

RegionalJustificationDialog.defaultProps = {
    onSubmit: () => undefined,
} as RegionalJustificationDialogProps

export interface RegionalJustificationDialogProps extends RegionalJustificationDialogPropsBase {
    policy: Eventkit.RegionPolicy;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
    classes: { [className: string]: string };
}

export function RegionalJustificationDialog(props: RegionalJustificationDialogProps) {
    const {
        isOpen, policy, onClose, onSubmit, classes, width,
    } = props;

    const [{status, response}, requestCall] = useAsyncRequest();
    const makeRequest = (regionUid: string, id: string, justificationValue?: string) => {
        requestCall({
            url: '/api/regions/justifications',
            method: 'post',
            data: {
                justification_id: id,
                justification_description: justificationValue,
                regional_policy_uid: regionUid,
            },
            headers: {'X-CSRFToken': getCookie('csrftoken')},
        }).then(() => undefined);
    };

    function renderTitle() {
        if (!policy) {
            return (<>Region Policy</>)
        }
        return (
            <div dangerouslySetInnerHTML={{__html: policy.policy_title_text}}/>
        );
    }

    function renderHeader() {
        if (!policy) {
            return (<>loading...</>)
        }
        return (
            <div dangerouslySetInnerHTML={{__html: policy.policy_header_text}}/>
        );
    }

    function renderFooter() {
        if (!policy) {
            return (<>loading...</>)
        }
        return (
            <div dangerouslySetInnerHTML={{__html: policy.policy_footer_text}}/>
        );
    }

    const [selectedOption, setSelectedOption] = useState(undefined);
    const [optionValues, setOptionValues] = useState({});
    useEffect(() => {
        const newValues = {};
        if (!!policy) {
            policy.justification_options.map(option => {
                if (!option.suboption) {
                    newValues[option.id] = option.name;
                }
            })
        }
        setOptionValues(newValues);
    }, [!!policy]);

    function renderOptions() {
        function setLabelValue(option: Eventkit.JustificationOption, value: string) {
            setOptionValues((prevState) => ({
                ...prevState,
                [option.id]: value,
            }))
        }

        function getOptionLabel(option: Eventkit.JustificationOption) {
            const {suboption} = option;
            const enabled = option.id === selectedOption?.id;
            if (enabled && !!suboption) {
                if (suboption.type === 'text') {
                    return (
                        <TextLabel
                            enabled={enabled}
                            option={option}
                            onChange={(e: any) => setLabelValue(option, e.target.value)}
                        />
                    )
                } else if (suboption.type === 'dropdown') {
                    return (
                        <JustificationDropdown
                            enabled={enabled}
                            selected={optionValues[option.id]}
                            option={option}
                            onChange={(e: any) => setLabelValue(option, e.target.value)}
                        />
                    )
                }
            }
            return (<div dangerouslySetInnerHTML={{__html: option.name}}/>)
        }

        return (
            <div>
                {policy.justification_options.filter(option => option.display).map(
                    (option, ix) => (
                        <div className={classes.justificationOption} key={`${ix}-${option.id}`}>
                            <Radio
                                checked={selectedOption?.id === option.id}
                                value={selectedOption?.id}
                                classes={{
                                    root: classes.checkbox, checked: classes.checked,
                                }}
                                onClick={() => setSelectedOption(option)}
                                name="source"
                            />
                            {getOptionLabel(option)}
                        </div>
                    )
                )}
            </div>
        );
    }

    function getActionProps() {
        const actionProps = {
            actionsStyle: {
                justifyContent: 'space-between',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderRadius: '4px',
            },
            actions: [],
        } as any;
        if (policy) {
            actionProps.actions = [
                (
                    <Button classes={{root: classes.cancelAndExitButton, label: classes.cancelAndExitButtonLabel}}
                            key="cancelAndExit"
                            variant="contained"
                            size="large"
                            color="primary"
                            onClick={onClose}
                    >
                        <strong>
                            {policy.policy_cancel_button_text}
                        </strong>
                    </Button>

                ),
                (<div>{policy.policy_cancel_text}</div>)];
        }
        return actionProps;
    }

    function getDialogProps() {
        const dialogProps = {} as any;
        if (!isSmallScreen()) {
            dialogProps.innerMaxHeight = 600;
        } else {
            dialogProps.bodyProps = {className: classes.dialog};
            dialogProps.dialogStyle = {
                width: '95%',
                maxHeight: '90%',
                margin: '10px',
            }
        }
        return dialogProps;
    }

    function canSubmit() {
        if (!policy || !selectedOption) {
            return false;
        }
        if (!!selectedOption.suboption) {
            return !!optionValues[selectedOption.id];
        }
        return true;
    }

    function submitAcknowledgement() {
        if (!canSubmit()) {
            return;
        }
        makeRequest(
            policy.uid,
            selectedOption.id,
            (selectedOption.suboption) ? optionValues[selectedOption.id] : undefined,
        );
        onSubmit();
        onClose();
    }

    const [isPolicyOpen, setIsPolicyOpen] = useState(false);
    const isSmallScreen = () => !isWidthUp('sm', width);

    return (
        <BaseDialog
            className="qa-ProviderError-BaseDialog"
            show={isOpen}
            title={renderTitle()}
            onClose={onClose}
            {...getActionProps()}
            {...getDialogProps()}
        >
            {renderIf(() => (
                <div style={{display: 'flex'}}>
                    <CircularProgress style={{margin: 'auto'}}/>
                </div>
            ), !policy)}
            {renderIf(() => (
                <div className={`${!isSmallScreen() ? classes.outerContainer : classes.outerContainerSm}`}>
                    {renderHeader()}
                    <div className={`${classes.policyCollapse} ${(!isPolicyOpen) ? classes.collapsed : ''}`}>
                        <div
                            className={`${(isPolicyOpen) ? classes.policyCollapseHeader : ''}`}
                            style={{display: isSmallScreen() ? 'flex' : 'block'}}
                        >
                            <strong dangerouslySetInnerHTML={{__html: policy.policies[0].title}}/>
                            {renderIf(() => (
                                <ExpandLess
                                    id="ExpandButton"
                                    className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                                    onClick={() => setIsPolicyOpen(false)}
                                    color="primary"
                                />
                            ), isPolicyOpen)}
                            {renderIf(() => (
                                <ExpandMore
                                    id="ExpandButton"
                                    className={`qa-DataProvider-ListItem-Expand ${classes.expand}`}
                                    onClick={() => setIsPolicyOpen(true)}
                                    color="primary"
                                />
                            ), !isPolicyOpen)}
                        </div>
                        <Collapse in={isPolicyOpen} className={`${(!isPolicyOpen) ? classes.hidden : ''}`}>
                            <div dangerouslySetInnerHTML={{__html: policy.policies[0].description}}/>
                        </Collapse>
                    </div>
                    {renderOptions()}
                    {renderFooter()}
                    <div className={classes.okayButtonContainer}>
                        <Button
                            className={classes.okayButton}
                            key="submit"
                            variant="contained"
                            color="primary"
                            onClick={submitAcknowledgement}
                            style={{whiteSpace: 'nowrap'}}
                            disabled={!canSubmit()}
                        >
                            okay
                        </Button>
                    </div>
                </div>
            ), !!policy)}
        </BaseDialog>
    );
}

export default withWidth()(withTheme((withStyles(jss)(RegionalJustificationDialog))));
