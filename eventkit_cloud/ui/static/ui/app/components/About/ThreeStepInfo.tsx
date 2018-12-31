import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';

export interface Props {
    steps: Array<{
        img: string;
        caption: string;
    }>;
    tableStyle?: object;
    theme: Eventkit.Theme & Theme;
}

export class ThreeStepInfo extends React.Component<Props, {}> {
    render() {
        const { theme } = this.props;
        const styles = {
            threeStepCaption: {
                backgroundColor: theme.eventkit.colors.primary,
                padding: '5px',
                color: theme.eventkit.colors.white,
                minHeight: '50px',
                width: '95%',
            },
            table: {
                borderCollapse: 'collapse' as 'collapse',
                marginBottom: '30px',
                fontSize: '14px',
                ...this.props.tableStyle,
            },
        };

        if (this.props.steps.length !== 3) {
            return null;
        }

        return (
            <table
                style={styles.table}
            >
                <tbody>
                    <tr>
                        <td style={{ verticalAlign: 'top' }} className="qa-ThreeStepInfo-step1">
                            <img
                                src={this.props.steps[0].img}
                                style={{ display: 'block', width: '95%', marginRight: '5%' }}
                                alt={this.props.steps[0].caption}
                            />
                            <div style={{ ...styles.threeStepCaption, marginRight: '5%' }}>
                                {this.props.steps[0].caption}
                            </div>
                        </td>
                        <td style={{ verticalAlign: 'top', margin: '0px 5px' }} className="qa-ThreeStepInfo-step2">
                            <img
                                src={this.props.steps[1].img}
                                style={{ display: 'block', width: '95%', margin: 'auto' }}
                                alt={this.props.steps[1].caption}
                            />
                            <div style={{ ...styles.threeStepCaption, margin: 'auto' }}>{this.props.steps[1].caption}</div>
                        </td>
                        <td style={{ verticalAlign: 'top' }} className="qa-ThreeStepInfo-step3">
                            <img
                                src={this.props.steps[2].img}
                                style={{ display: 'block', width: '95%', marginLeft: '5%' }}
                                alt={this.props.steps[2].caption}
                            />
                            <div style={{ ...styles.threeStepCaption, marginLeft: '5%' }}>
                                {this.props.steps[2].caption}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

export default withTheme()(ThreeStepInfo);
