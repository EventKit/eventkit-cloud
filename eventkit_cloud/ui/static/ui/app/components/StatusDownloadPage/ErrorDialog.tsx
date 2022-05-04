import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Divider from '@mui/material/Divider';
import Warning from '@mui/icons-material/Warning';
import BaseDialog from '../Dialog/BaseDialog';
import {renderIf} from "../../utils/renderIf";
import {useBoolean} from "../../utils/hooks/hooks";
import Button from "@mui/material/Button";

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
    const UNKNOWN_ERROR_MESSAGE = "An unknown error occurred. Please contact an administrator."

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
                    {error.exception || UNKNOWN_ERROR_MESSAGE}
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
                        justifyContent: 'end',
                    }}
                    actions={
                        [
                            (
                                <Button
                                    style={{marginLeft: '15px'}}
                                    key="close"
                                    variant="contained"
                                    color="primary"
                                    onClick={setClosed}
                                >
                                    Close
                                </Button>
                            ),
                            (
                                <Button
                                    style={{marginLeft: '15px'}}
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
                            ),
                        ]
                    }
                >
                    {renderErrors()}
                </BaseDialog>
            </span>
    ), true)
}

export default withTheme(ErrorDialog);
