import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';

export interface Props {
    title: string;
    data: any;
    containerStyle: object;
    titleStyle: object;
    dataStyle: object;
    theme: Eventkit.Theme & Theme;
}

export class CustomTableRow extends React.Component<Props, {}> {
    static defaultProps = {
        containerStyle: {},
        titleStyle: {},
        dataStyle: {},
    };

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            container: {
                display: 'flex',
                flex: '0 1 auto',
                width: '100%',
                padding: '5px 0px',
                ...this.props.containerStyle,
            },
            title: {
                display: 'flex',
                flex: '0 0 auto',
                width: '140px',
                backgroundColor: colors.secondary,
                padding: '10px',
                marginRight: '5px',
                ...this.props.titleStyle,
            },
            data: {
                display: 'flex',
                flex: '1 1 auto',
                flexWrap: 'wrap' as 'wrap',
                alignItems: 'center',
                backgroundColor: colors.secondary,
                color: colors.text_primary,
                padding: '10px',
                wordBreak: 'break-word' as 'break-word',
                width: '100%',
                ...this.props.dataStyle,
            },
        };

        return (
            <div
                className="qa-CustomTableRow"
                style={styles.container}
            >
                <div style={styles.title}>
                    <strong>{this.props.title}</strong>
                </div>
                <div style={styles.data}>
                    {this.props.data}
                </div>
            </div>
        );
    }
}

export default withTheme()(CustomTableRow);
