import React from 'react';
import {IconButton} from '@material-ui/core';
import ArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import ArrowRight from '@material-ui/icons/KeyboardArrowRight';
import {withTheme, withStyles, createStyles, Theme} from '@material-ui/core/styles';
import SwipeableViews from 'react-swipeable-views';


const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    container: {
        display: 'flex',
        height: '100%',
        width: '100%'
    },
    button: {
        zIndex: 1,
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        position: 'absolute',
        margin: 'auto',
        color: theme.eventkit.colors.secondary,
    },
    iconStyle: {
        width: '48px',
        height: '48px',
        backgroundColor: theme.eventkit.colors.primary,
    },
    img: {
        margin: 'auto',
        maxWidth: '100%'
    },
});


interface Props {
    providerTasks: Eventkit.ProviderTask[];
    classes: { [className: string]: string };
    selectedProvider?: string;
    selectProvider: (providerTask: Eventkit.ProviderTask) => void;
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
        this.setArrowVisibility = this.setArrowVisibility.bind(this);
        this.setProvider = this.setProvider.bind(this);
        this.state = {
            step: (!!props.selectedProvider) ? props.providerTasks.map(
                provider => provider.slug).indexOf(props.selectedProvider) : 0,
            arrowsVisible: false
        }
    };

    nextStep() {
        let step = this.state.step + 1;
        if (step >= this.props.providerTasks.filter(providerTask => !!providerTask.preview_url).length) {
            step = 0;
        }
        this.setProvider(step);
    }

    previousStep() {
        let step = this.state.step - 1;
        if (step < 0) {
            step = this.props.providerTasks.filter(providerTask => !!providerTask.preview_url).length - 1;
        }
        this.setProvider(step);
    }

    setArrowVisibility(visible) {
        this.setState({arrowsVisible: visible});
    }

    setProvider(stepIndex: number) {
        this.setState({step: stepIndex});
        return this.props.selectProvider(this.props.providerTasks.filter(providerTask => !!providerTask.preview_url)[stepIndex]);
    }

    render() {
        const {classes} = this.props;
        const {step} = this.state;
        const providerPreviews = this.props.providerTasks.filter(providerTask => !!providerTask.preview_url);

        const buttonsVisible = this.state.arrowsVisible && providerPreviews.length > 1;

        return (
            <div
                className={classes.container}
                onMouseEnter={() => {
                    this.setArrowVisibility(true)
                }}
                onMouseLeave={() => {
                    this.setArrowVisibility(false)
                }}
            >
                <IconButton
                    className={classes.button}
                    disabled={providerPreviews.length <= 1}
                    style={{
                        right: 'unset',
                        visibility: buttonsVisible ? 'visible' as 'visible' : 'hidden' as 'hidden'
                    }}
                    onClick={(event) => {
                        this.nextStep()
                    }}>
                    <ArrowLeft className={classes.iconStyle}/>
                </IconButton>
                <SwipeableViews index={step} onChangeIndex={index => {
                    this.setProvider(index);
                }}>
                    {providerPreviews.map((providerTask, ix) =>
                        (
                            <div className={classes.container} key={ix}>
                                <img
                                    className={classes.img}
                                    src={providerTask.preview_url}
                                />
                            </div>
                        )
                    )}
                    <div className={classes.container} key={-1}>
                        <div className={classes.img}> empty</div>
                    </div>
                </SwipeableViews>
                <IconButton
                    className={classes.button}
                    style={{
                        left: 'unset',
                        visibility: buttonsVisible ? 'visible' as 'visible' : 'hidden' as 'hidden'
                    }}
                    onClick={(event) => {
                        this.previousStep()
                    }}>
                    <ArrowRight className={classes.iconStyle}/>
                </IconButton>
            </div>
        );
    };
};


export default withTheme(withStyles(jss)(ProviderPreview));

