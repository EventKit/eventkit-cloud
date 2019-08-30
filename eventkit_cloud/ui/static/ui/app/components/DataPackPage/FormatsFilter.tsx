import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Checked from '@material-ui/icons/CheckBox';

export interface Props {
    formats: Eventkit.Format[];
    selected: object;
    onChange: (slug: string, checked: boolean) => void;
    theme: Eventkit.Theme & Theme;
}

export class FormatsFilter extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;
        const { formats } = this.props;

        const styles = {
            container: {
                width: '100%',
                padding: '0px 10px',
            },
            title: {
                width: '100%',
                margin: '0px',
                lineHeight: '36px',
            },
            provider: {
                display: 'flex',
                flexWrap: 'nowrap' as 'nowrap',
                lineHeight: '24px',
                paddingBottom: '8px',
                color: colors.text_primary,
                fontWeight: 700,
            },
            checkbox: {
                width: '24px',
                height: '24px',
                flex: '0 0 auto',
                marginRight: '5px',
            },
        };

        const checkedIcon = (<Checked color="primary" />);

        return (
            <div style={styles.container}>
                <p
                    className="qa-FormatsFilter-p"
                    style={styles.title}
                >
                    <strong>Formats</strong>
                </p>
                {formats.map(format => (
                    <div style={styles.provider} key={format.slug}>
                        <Checkbox
                            className="qa-FormatsFilter-Checkbox"
                            key={format.slug}
                            style={styles.checkbox}
                            checked={!!this.props.selected[format.slug]}
                            checkedIcon={checkedIcon}
                            onChange={(e, v) => {
                                this.props.onChange(format.slug, v);
                            }}
                        />
                        <span
                            className="qa-FormatsFilter-name"
                            style={{ display: 'flex', flex: '1 1 auto' }}
                        >
                            {format.name}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
}

export default withTheme()(FormatsFilter);
