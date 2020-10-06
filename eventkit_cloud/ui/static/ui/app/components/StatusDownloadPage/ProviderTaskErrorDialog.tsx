import * as React from 'react';
import { withTheme } from '@material-ui/core/styles';
import ErrorDialog, { ErrorDialogProps } from './ErrorDialog';

interface ProviderTaskProps extends Omit<ErrorDialogProps, 'errors'|'name'> {
    providerTask: Eventkit.ProviderTask;
}

export function ProviderTaskError(props: ProviderTaskProps) {
    const errors = [];
    props.providerTask.tasks.filter(
        (task) => task.display && task.errors.length
    ).map((task) => task.errors.forEach((error) => errors.push(error)));
    return (
        <ErrorDialog
            errors={errors}
            onRetryClicked={props.onRetryClicked}
            name={props.providerTask.name}
        />
    );
}

export default withTheme(ProviderTaskError);
