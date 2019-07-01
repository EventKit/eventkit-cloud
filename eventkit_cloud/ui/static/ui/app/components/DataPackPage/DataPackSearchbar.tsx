import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

export interface Props {
    onSearchChange: (search: string) => void;
    onSearchSubmit: (search: string) => void;
    defaultValue: string;
    theme: Eventkit.Theme & Theme;
}

export class DataPackSearchbar extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    private handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
            const text = (event.target as HTMLInputElement).value || '';
            this.props.onSearchSubmit(text);
        }
    }

    private handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const text = event.target.value || '';
        this.props.onSearchChange(text);
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const styles = {
            container: {
                height: '36px',
                width: '100%',
                backgroundColor: colors.background,
                lineHeight: '36px',
            },
            input: {
                color: colors.white,
                height: '36px',
                width: '100%',
                lineHeight: '36px',
                padding: '0px 10px',
                fontSize: '16px',
            },
        };

        return (
            <TextField
                className="qa-DataPackSearchBar-TextField"
                style={styles.container}
                inputProps={{ style: styles.input }}
                placeholder="Search DataPacks"
                onChange={this.handleChange}
                onKeyDown={this.handleKeyDown}
                defaultValue={this.props.defaultValue}
            />
        );
    }
}

export default withTheme()(DataPackSearchbar);
