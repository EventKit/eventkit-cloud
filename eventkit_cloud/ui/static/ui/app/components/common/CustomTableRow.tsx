import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {withTheme, Theme, withStyles, createStyles} from '@material-ui/core/styles';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    container: {
        display: 'flex',
        flex: '0 1 auto',
        width: '100%',
        padding: '5px 0px',
    },
    title: {
        display: 'flex',
        flex: '0 0 auto',
        width: '140px',
        backgroundColor: theme.eventkit.colors.secondary,
        padding: '10px',
        marginRight: '5px',
    },
    data: {
        display: 'flex',
        flex: '1 1 auto',
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: theme.eventkit.colors.secondary,
        color: theme.eventkit.colors.text_primary,
        padding: '10px',
        wordBreak: 'break-word',
        width: '100%',
    },
});

export interface Props {
    title: string;
    containerStyle: any;
    titleStyle: any;
    dataStyle: any;
    className: string;
    classes: { [className: string]: string; };
}

export class CustomTableRow extends Component<Props> {

    static defaultProps = {
        containerStyle: {},
        titleStyle: {},
        dataStyle: {},
        className: 'qa-CustomTableRow',
    };

    render() {
        const { classes } = this.props;
        return (
            <div
                className={`${this.props.className  } ${  classes.container}`}
                style={this.props.containerStyle}
            >
                <div className={classes.title} style={this.props.titleStyle}>
                    <strong>{this.props.title}</strong>
                </div>
                <div className={classes.data} style={this.props.dataStyle}>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

export default withTheme(withStyles(jss)(CustomTableRow));
