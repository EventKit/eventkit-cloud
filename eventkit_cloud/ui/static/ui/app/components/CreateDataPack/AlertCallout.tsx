import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import css from '../../styles/popup.css';

export interface Props {
    className?: string;
    title?: string;
    body?: any;
    orientation: 'top' | 'bottom' | 'top-left' | 'top-right' | 'right-bottom' | 'left-bottom';
    style?: object;
    onClose: () => void;
    theme: Eventkit.Theme & Theme;
}

export class AlertCallout extends React.Component<Props, {}> {
    render() {
        const styles = {
            clear: {
                height: '20px',
                width: '20px',
                flex: '0 0 auto',
                fill: this.props.theme.eventkit.colors.primary,
                cursor: 'pointer',
            },
        };

        return (
            <div
                className={`${css.callout} ${css[this.props.orientation]} qa-AlertCallout ${this.props.className}`}
                style={this.props.style}
            >
                <div
                    style={{ minHeight: '20px', display: 'flex', marginBottom: '10px' }}
                    className="qa-AlertCallout-title"
                >
                    <div style={{ flexWrap: 'wrap', flex: '1 1 auto' }}><strong>{this.props.title}</strong></div>
                    <Clear
                        className="qa-AlertCallout-alert-close"
                        style={styles.clear}
                        onClick={this.props.onClose}
                    />
                </div>
                <div className="qa-AlertCallout-body">
                    {this.props.body}
                </div>
            </div>
        );
    }
}

export default withTheme()(AlertCallout);
