import React from 'react';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import {withTheme, withStyles, createStyles, Theme} from '@material-ui/core/styles';
import SwipeableViews from 'react-swipeable-views';


const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    numberStyle: {
        border: '2px solid #fff',
        borderRadius: '50%',
        width: '12px',
        height: '12px',
        textAlign: 'center',
        fontSize: '12px',
        display: 'inline-block',
        marginLeft: '10px',
        backgroundColor: '#fff',
        color: '#4598bf',
        cursor: 'pointer',
    },
    nextImgArrow: {
        width: '48px',
        height: '48px',
        minWidth: 'none',
        color: '#4598bf',
        textAlign: 'center',
    },
    nextImgDiv: {
        position: 'absolute',
        width: '48px',
        height: '48px',
        minWidth: 'none',
        borderRadius: '50%',
        color: '#4598bf',
        top: 'calc(50% - 24px)',
        backgroundColor: 'rgba(69, 152, 191, 0.2)'
    }
});


interface Props {
    providerTasks: Eventkit.ProviderTask[];
    classes: { [className: string]: string };
}

interface State {
    step: number;
    arrowsVisible: boolean;
}

export class ProviderPreview extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.nextStep = this.nextStep.bind(this);
        this.previousStep = this.previousStep.bind(this);
        this.goToStep = this.goToStep.bind(this);
        this.setArrowVisibility = this.setArrowVisibility.bind(this);
        this.state = {
            step: 0,
            arrowsVisible: false
        }
    };

    nextStep() {
        if (this.state.step + 1 < this.props.providerTasks.length) {
            this.setState({step: this.state.step + 1});
        } else {
            this.setState({step: 0});
        }
    }

    previousStep() {
        if (this.state.step > 0) {
            this.setState({step: this.state.step - 1});
        } else {
            this.setState({step: this.props.providerTasks.length - 1});
        }
    }

    goToStep(step) {
        if (step < this.props.providerTasks.length && step >= 0) {
            this.setState({step: step});
        }
    }

    setArrowVisibility(visible) {
        this.setState({arrowsVisible: visible});
    }

    render() {
        const largeScreen = window.innerWidth > 991;
        const stepTotal = this.props.providerTasks.length;
        const arrowOpacity = this.state.arrowsVisible ? 1 : 0;
        const captionFontSize = largeScreen ? 16 : 14;
        const numberDiameter = largeScreen ? 25 : 20;
        const numberWidth = numberDiameter + 10;

        const {classes} = this.props;

        return (
            <div style={{margin: '10px 0px'}}>
                <Card style={{backgroundColor: '#dcdcdc'}}>
                    <CardHeader
                        title={<strong>TITLE</strong>}
                        // openIcon={<NavigationArrowDropUp style={{fill: 'red'}}/>}
                        // closeIcon={<NavigationArrowDropDown style={{fill: 'green'}}/>}
                    />
                    <CardMedia style={{padding: '0px 10px 10px 10px'}}>
                        <div id='mediaContainer' style={{width: '100%', height: '100%', position: 'relative'}}
                             onMouseEnter={() => {
                                 this.setArrowVisibility(true)
                             }}
                             onMouseLeave={() => {
                                 this.setArrowVisibility(false)
                             }}
                        >
                            <SwipeableViews
                                onSwipedLeft={this.nextStep}
                                onSwipedRight={this.previousStep}
                            >
                                <img src={this.props.providerTasks[this.state.step].preview_url}
                                     style={{width: '100%'}}/>
                            </SwipeableViews>
                            <div
                                className={classes.nextImgDiv}
                                style={{left: '20px', opacity: arrowOpacity}}>
                                {/*<ChevronLeft className={classes.nextImgArrow} onClick={this.previousStep}/>*/}
                            </div>
                            <div
                                className={classes.nextImageDiv}
                                style={{right: '20px', opacity: arrowOpacity}}
                            >
                                {/*<ChevronRight className={classes.nextImgArrow} onClick={this.nextStep}/>*/}
                            </div>
                        </div>
                        <div id='captionContainer'
                             style={{width: '100%', backgroundColor: '#4598bf', color: '#fff', padding: '7px 10px'}}>
                            <div id='captionText' style={{
                                display: 'inline-block',
                                width: `calc(100% - ${stepTotal * numberWidth}px)`,
                                fontSize: captionFontSize
                            }}>
                                CAPTION
                            </div>
                            <div id='stepsContainer' style={{
                                display: 'inline-block',
                                width: `${stepTotal * numberWidth}px`,
                                verticalAlign: 'top'
                            }}>
                                {this.props.providerTasks.map((item, ix) => {
                                    const style = {
                                        backgroundColor: this.state.step == ix ? '#fff' : 'inherit',
                                        color: this.state.step == ix ? '#4598bf' : 'inherit'
                                    };
                                    return <div key={ix} className={classes.numberStyle} id='stepNumber' style={style} onClick={() => {
                                        this.goToStep(ix)
                                    }}>{ix + 1}</div>
                                })}
                            </div>
                        </div>
                    </CardMedia>
                </Card>
            </div>
        );
    };
};


export default withTheme()(withStyles(jss)(ProviderPreview));

