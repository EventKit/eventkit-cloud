import { useState } from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomScrollbar from '../common/CustomScrollbar';

export interface Props {
    license: Eventkit.License;
    checked: boolean;
    onCheck: (slug: string, checked: boolean) => void;
    disabled: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    expanded: boolean;
}

export const UserLicense = (props: Props) => {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        setExpanded(!expanded);
    };

    const { colors } = props.theme.eventkit;

    const styles = {
        card: {
            boxShadow: 'none',
            marginBottom: '10px',
            border: props.checked ? `1px solid ${colors.secondary}` : `1px solid ${colors.warning}`,
        },
        checkbox: {
            width: '24px',
            height: '24px',
            verticalAlign: 'middle',
            marginRight: '10px',
            color: colors.primary,
        },
        cardText: {
            border: `2px solid ${colors.secondary}`,
            padding: '0px',
        },
        expand: {
            width: '24px',
            height: '24px',
            float: 'right' as 'right',
            transform: 'rotate(0deg)',
            transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        },
    };

    if (expanded) {
        styles.expand.transform = 'rotate(180deg)';
    }

    return (
        <Card
            className="qa-UserLicense-Card"
            style={styles.card}
        >
            <CardHeader
                className="qa-UserLicense-CardHeader"
                style={{ backgroundColor: colors.secondary, padding: '16px' }}
                title={
                    <div>
                        <Checkbox
                            className="qa-UserLicense-Checkbox"
                            style={styles.checkbox}
                            checked={props.checked}
                            onChange={(e, v) => { props.onCheck(props.license.slug, v); }}
                            disabled={props.disabled}
                        />
                        <span className="qa-UserLicense-agreement" style={{ lineHeight: '24px' }}>
                                {'I agree to the '}<strong>{props.license.name}</strong>
                            </span>
                        <IconButton
                            onClick={handleToggle}
                            color="primary"
                            style={styles.expand}
                            className="qa-UserLicense-expand"
                        >
                            <ExpandMoreIcon />
                        </IconButton>
                    </div>
                }
            />
            <Collapse in={expanded}>
                <CardContent className="qa-UserLicense-CardText" style={styles.cardText}>
                    <CustomScrollbar style={{ height: '200px', width: '100%' }}>
                        <div className="qa-UserLicense-licenseText" style={{ padding: '16px', whiteSpace: 'pre-wrap' }}>
                            <a href={`/api/licenses/${props.license.slug}/download`}>- Download this license text -</a>
                            <br />
                            <br />
                            {props.license.text}
                        </div>
                    </CustomScrollbar>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default withTheme(UserLicense);
