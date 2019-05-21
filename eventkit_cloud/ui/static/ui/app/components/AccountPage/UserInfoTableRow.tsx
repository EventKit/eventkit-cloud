import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';

export interface Props {
    title: string;
    data: string;
    theme: Eventkit.Theme & Theme;
}

export class UserInfoTableRow extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            tr: {
                lineHeight: '35px',
            },
            title: {
                padding: '0px 15px',
                backgroundColor: colors.secondary,
                whiteSpace: 'nowrap' as 'nowrap',
            },
            data: {
                padding: '0px 15px',
                backgroundColor: colors.secondary,
                color: colors.grey,
                width: '99%',
            },
        };

        if (!this.props.title || !this.props.data) {
            return null;
        }

        return (
            <tr className="qa-UserInfoTableRow-tr" style={styles.tr}>
                <td style={styles.title}><strong>{this.props.title}</strong></td>
                <td style={styles.data}>{this.props.data}</td>
            </tr>
        );
    }
}

export default withTheme()(UserInfoTableRow);
