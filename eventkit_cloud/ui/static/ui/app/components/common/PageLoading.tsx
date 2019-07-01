import * as React from 'react';
import { withStyles, withTheme, createStyles, Theme } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const jss = () => createStyles({
    full: {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw',
        display: 'inline-flex',
    },
    partial: {
        height: '100%',
        width: '100%',
        display: 'inline-flex',
    },
    progress: {
        margin: 'auto',
        display: 'block',
    },
});

interface Props {
    background?: "solid" | "transparent" | "pattern";
    partial?: boolean;
    theme: Theme & Eventkit.Theme;
    classes: {
        full: string;
        partial: string;
        progress: string;
    };
    style?: any;
}

export function PageLoading(props: Props) {
    const { classes, background, partial, theme } = props;

    const style: any = { ...props.style };

    if (background === 'solid') {
        style.backgroundColor = theme.eventkit.colors.background;
    } else if (background === 'transparent') {
        style.backgroundColor = theme.eventkit.colors.backdrop;
    } else if (background === 'pattern') {
        style.backgroundImage = `url(${theme.eventkit.images.topo_dark})`;
    }

    return (
        <div
            className={`qa-loading-body ${partial ? classes.partial : classes.full}`}
            style={style}
        >
            <CircularProgress
                className={classes.progress}
                color="primary"
                size={50}
            />
        </div>
    );
}

export default withTheme()(withStyles<any, any>(jss)(PageLoading));
