import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';

export interface Props {
    style: object;
    range: string;
    handleLoadLess: () => void;
    handleLoadMore: () => void;
    loadLessDisabled: boolean;
    loadMoreDisabled: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    width: string | number;
}

export class LoadButtons extends React.Component<Props, State> {
    private self = React.createRef<HTMLDivElement>();
    constructor(props) {
        super(props);
        this.setWidth = this.setWidth.bind(this);
        this.state = {
            width: '100vw',
        };
    }

    componentDidMount() {
        this.setWidth();
    }

    componentDidUpdate() {
        this.setWidth();
    }

    private setWidth() {
        const width = this.self.current.clientWidth;
        if (width !== this.state.width) {
            this.setState({ width });
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const range = this.props.range ? this.props.range.split('/') : null;
        const inlineStyles = {
            container: {
                textAlign: 'center' as 'center',
                margin: '0px 10px',
                position: 'relative' as 'relative',
                ...this.props.style,
            },
            range: this.state.width < 768 ?
                {
                    color: colors.text_primary,
                    lineHeight: '36px',
                    fontSize: '12px',
                }
                :
                {
                    display: 'inline-block',
                    position: 'absolute' as 'absolute',
                    color: colors.text_primary,
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
        };

        return (
            <div style={inlineStyles.container} ref={this.self}>
                <div style={{ display: 'inline-block' }}>
                    {this.props.handleLoadLess ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showLess'"
                            variant="contained"
                            color="secondary"
                            style={{ minWidth: '145px', margin: '5px 2.5px' }}
                            disabled={this.props.loadLessDisabled}
                            onClick={this.props.handleLoadLess}
                        >
                            Show Less
                            <KeyboardArrowUp />
                        </Button>
                        :
                        null
                    }
                    <Button
                        className="qa-LoadButtons-RaisedButton-showLess"
                        variant="contained"
                        color="secondary"
                        style={{ minWidth: '145px', margin: '5px 2.5px' }}
                        disabled={this.props.loadMoreDisabled}
                        onClick={this.props.handleLoadMore}
                    >
                        Show More
                        <KeyboardArrowDown />
                    </Button>
                </div>
                <div className="qa-LoadButtons-range" id="range" style={inlineStyles.range}>
                    {range ? `${range[0]} of ${range[1]}` : ''}
                </div>
            </div>
        );
    }
}

export default withTheme()(LoadButtons);
