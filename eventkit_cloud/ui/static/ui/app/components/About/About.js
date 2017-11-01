import React, {Component} from 'react';
import AppBar from 'material-ui/AppBar';
import CustomScrollbar from '../CustomScrollbar';
import InfoParagraph from './InfoParagraph';
import ThreeStepInfo from './ThreeStepInfo';
import QuickTour from './QuickTour';
import QuickTourSection from './QuickTourSection';
import {Config} from '../../config.js';

export class About extends Component {

    constructor(props) {
        super(props);
        this.state = {
            pageInfo: null
        }
    };

    componentDidMount() {
        // later this could be api call --> set state
        this.setState({pageInfo: Config.ABOUT_PAGE});
    };

    render() {
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                padding: '0px 34px'
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
            },
            body: {
                height: window.innerHeight - 130,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
            },
            bodyContent: {
                padding: '30px 34px 60px',
                maxWidth: '1000px', 
                margin: 'auto',
            },
            threeStepCaption: {
                backgroundColor: '#4598bf', 
                padding: '5px', 
                color: '#fff', 
                minHeight: '50px', 
                width: '95%',
            }
            
        };

        if(!this.state.pageInfo) {
            return null;
        }

        return (
            <div style={{backgroundColor: 'white'}}>
                <AppBar
                    className={'qa-About-AppBar'}
                    title={'About EventKit'}
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
                >
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{height: window.innerHeight - 130, width: '100%'}}>
                        <div style={styles.bodyContent} className={'qa-About-bodyContent'}>
                            {this.state.pageInfo.textParagraphs.map((paragraph, ix) => {
                                return (
                                    <InfoParagraph key={ix} header={paragraph.header} body={paragraph.body} bodyStyle={{marginBottom: '30px'}}/>
                                )
                            })}
                            <ThreeStepInfo steps={this.state.pageInfo.threeStep}/>
                            {this.state.pageInfo.quickTour.length > 0 ?
                                <h3 style={{marginTop: '60px'}}><strong>Quick Tour</strong></h3>
                                :
                                null
                            }
                            {this.state.pageInfo.quickTour.map((tour, ix) => {
                                return (
                                    <QuickTour key={ix} header={tour.header} tourSections={tour.tourSections} containerStyle={{marginTop: '30px'}}/>
                                )
                            })}
                        </div>
                    </CustomScrollbar> 
                </div>
            </div>
        )
    };
};

export default About;
