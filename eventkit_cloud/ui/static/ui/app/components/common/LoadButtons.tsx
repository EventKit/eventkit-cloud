import { createRef, Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import Button from '@mui/material/Button';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";

export interface Props {
    style?: object;
    range: string;
    handleLoadLess: () => void;
    handleLoadMore: () => void;
    loadLessDisabled: boolean;
    loadMoreDisabled: boolean;
    handleLoadPrevious: () => void;
    handleLoadNext: () => void;
    loadPreviousDisabled: boolean;
    loadNextDisabled: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    width: string | number;
}

export class LoadButtons extends Component<Props, State> {
    private self = createRef<HTMLDivElement>();
    static defaultProps: any = {
        style: {},
    }

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
            this.setState({width});
        }
    }

    render() {
        const {colors} = this.props.theme.eventkit;

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
                <div style={{display: 'inline-block'}}>
                    {this.props.handleLoadLess ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showLess'"
                            variant="contained"
                            color="secondary"
                            style={{minWidth: '145px', margin: '5px 2.5px'}}
                            disabled={this.props.loadLessDisabled}
                            onClick={this.props.handleLoadLess}
                        >
                            Show Less
                            <KeyboardArrowUp/>
                        </Button>
                        :
                        null
                    }
                    {this.props.handleLoadMore ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showMore"
                            variant="contained"
                            color="secondary"
                            style={{minWidth: '145px', margin: '5px 2.5px'}}
                            disabled={this.props.loadMoreDisabled}
                            onClick={this.props.handleLoadMore}
                        >
                            Show More
                            <KeyboardArrowDown/>
                        </Button>
                        : null
                    }
                    {this.props.handleLoadPrevious ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showPrevious"
                            variant="contained"
                            color="secondary"
                            style={{minWidth: '168px', margin: '5px 2.5px'}}
                            disabled={this.props.loadPreviousDisabled}
                            onClick={this.props.handleLoadPrevious}
                        >
                            <ArrowLeftIcon style={{fontSize: 'x-large'}}/>
                            Show Previous
                        </Button>
                        : null
                    }
                    {this.props.handleLoadNext ?
                        <Button
                            className="qa-LoadButtons-RaisedButton-showNext"
                            variant="contained"
                            color="secondary"
                            style={{minWidth: '168px', margin: '5px 2.5px'}}
                            disabled={this.props.loadNextDisabled}
                            onClick={this.props.handleLoadNext}
                        >
                            Show Next
                            <ArrowRightIcon style={{fontSize: 'x-large'}}/>
                        </Button>
                        :
                        null
                    }
                </div>
                <div className="qa-LoadButtons-range" id="range" style={inlineStyles.range}>
                    {range ? `${range[0]} of ${range[1]}` : ''}
                </div>
            </div>
        );
    }
}

export default withTheme(LoadButtons);
