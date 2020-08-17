import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import Warning from '@material-ui/icons/Warning';
import BaseDialog from '../Dialog/BaseDialog';
import {renderIf} from "../../utils/renderIf";
import {useBoolean} from "../../utils/hooks/hooks";
import Button from "@material-ui/core/Button";

export interface ErrorDialogProps {
    errors: Array<{
        exception: string;
    }>;
    name: string;
    onRetryClicked: () => void;
    theme: Eventkit.Theme & Theme;
}

export function ErrorDialog(props: ErrorDialogProps) {

    const [isOpen, setOpen, setClosed] = useBoolean(false);

    const {errors} = props;
    const {colors} = props.theme.eventkit;

    const styles = {
        errorText: {
            borderTopWidth: '10px',
            borderBottomWidth: '10px',
            borderLeftWidth: '10px',
            color: colors.warning,
            cursor: 'pointer',
            fontWeight: 'bold' as 'bold',
        },
        warning: {
            marginLeft: '10px',
            cursor: 'pointer',
            fill: colors.warning,
            verticalAlign: 'bottom',
        },
        warningIcon: {
            marginRight: '10px',
            fill: colors.warning,
            verticalAlign: 'bottom',
        },
    };

    function renderTitle() {
        return (
            <strong id="error-title">
                {props.name} has
                <strong style={{color: colors.warning}}> {errors.length} error(s).</strong>
            </strong>
        );
    }

    function renderErrors() {
        return (
            errors.slice(0, 3).map((error, ix) => (
                <div
                    key={ix}
                    className="qa-ProviderError-errorData"
                    style={{marginTop: '15px', width: '100%'}}
                    id="error-data"
                >
                    <Warning
                        className="qa-ProviderError-Warning-icon"
                        style={styles.warningIcon}
                    />
                    {error.exception}
                    <Divider
                        className="qa-ProviderError-Divider"
                        style={{marginTop: '15px'}}
                    />
                </div>
            ))
        )
    }

    return renderIf(() => (
        <span className="qa-ProviderError-span-errorText">
                <span
                    role="button"
                    tabIndex={0}
                    onKeyPress={setOpen}
                    onClick={setOpen}
                    style={styles.errorText}
                    className="qa-ProviderError-error-text"
                >
                    ERROR
                </span>
                <Warning
                    className="qa-ProviderError-Warning"
                    onClick={setOpen}
                    style={styles.warning}
                />
                <BaseDialog
                    className="qa-ProviderError-BaseDialog"
                    show={isOpen}
                    title={renderTitle()}
                    onClose={setClosed}
                    actionsStyle={{
                        paddingTop: '15px',
                        margin: 'auto',
                        flexDirection: 'initial',
                        justifyContent: 'initial',
                        paddingBottom: '20px',
                    }}
                    actions={
                        [(
                            <Button
                                key="retry"
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    props.onRetryClicked()
                                    setClosed();
                                }}
                            >
                                Retry
                            </Button>
                        ), (
                            <Button
                                key="close"
                                variant="contained"
                                color="primary"
                                onClick={setClosed}
                            >
                                Close
                            </Button>
                        )]
                    }
                >
                    {renderErrors()}
                </BaseDialog>
            </span>
    ), true)
}

export default withTheme()(ErrorDialog);
