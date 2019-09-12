import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Checked from '@material-ui/icons/CheckBox';

export interface Props {
    projections: Eventkit.Projection[];
    selected: object;
    onChange: (srid: number, checked: boolean) => void;
    theme: Eventkit.Theme & Theme;
}

export class ProjectionsFilter extends React.Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;
        const { projections } = this.props;

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
            projection: {
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
                    className="qa-ProjectionsFilter-p"
                    style={styles.title}
                >
                    <strong>Projections</strong>
                </p>
                {projections.map(projection => (
                    <div style={styles.projection} key={projection.srid}>
                        <Checkbox
                            className="qa-ProjectionsFilter-Checkbox"
                            key={projection.srid}
                            style={styles.checkbox}
                            checked={!!this.props.selected[projection.srid]}
                            checkedIcon={checkedIcon}
                            onChange={(e, v) => {
                                this.props.onChange(projection.srid, v);
                            }}
                        />
                        <span
                            className="qa-ProjectionsFilter-name"
                            style={{ display: 'flex', flex: '1 1 auto' }}
                        >
                            EPSG:{projection.srid}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
}

export default withTheme()(ProjectionsFilter);
