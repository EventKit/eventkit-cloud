import { Component } from 'react';
import { Theme } from '@mui/material/styles';

import withTheme from '@mui/styles/withTheme';

export interface Props {
    show: boolean;
    style?: object;
    theme: Eventkit.Theme & Theme;
}

export class FeaturedFlag extends Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;

        const style = {
            backgroundColor: colors.primary,
            color: colors.white,
            textAlign: 'center' as 'center',
            fontSize: '11px',
            position: 'absolute' as 'absolute',
            top: -15,
            right: -10,
            width: 100,
            height: 16,
            lineHeight: '16px',
            zIndex: 2,
            ...this.props.style,
        };

        if (!this.props.show) {
            return null;
        }

        return (
            <div className="qa-FeaturedFlag-div tour-datapack-featured" style={style}>FEATURED</div>
        );
    }
}

export default withTheme(FeaturedFlag);
