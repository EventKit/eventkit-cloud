import { withTheme, Theme } from '@material-ui/core/styles';

export interface Props {
    title: string;
    data: string;
    theme: Eventkit.Theme & Theme;
}

export const UserInfoTableRow = (props: Props) => {
    const { colors } = props.theme.eventkit;

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

    if (!props.title || !props.data) {
        return null;
    }

    return (
        <tr className="qa-UserInfoTableRow-tr" style={styles.tr}>
            <td style={styles.title}><strong>{props.title}</strong></td>
            <td style={styles.data}>{props.data}</td>
        </tr>
    );
};

export default withTheme(UserInfoTableRow);
