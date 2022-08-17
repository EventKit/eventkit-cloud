import * as React from 'react';
import {withTheme} from "@material-ui/core/styles";

export function PageNotFound(props) {
    return (<div>
        <h1>404 Error</h1>
        <h1>Page Not Found</h1>
    </div>);
}

export default withTheme(PageNotFound);
