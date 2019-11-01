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
    containerCard: {
        height: '800px',
        width: '800ox',
        backgroundColor: '#dcdcdc'
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
        const {classes} = this.props;

        return (
            <div style={{margin: '10px 0px', display: 'flex'}}>
                <CardMedia
                    style={{
                        padding: '0px 10px 10px 10px', height: '500px', width: '250px',
                        margin: 'auto'
                    }}
                    image={this.props.providerTasks[this.state.step].preview_url}
                />
            </div>
        );
    };
};


export default withTheme()(withStyles(jss)(ProviderPreview));

