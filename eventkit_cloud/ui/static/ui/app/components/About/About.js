import React, {Component} from 'react';
import AppBar from 'material-ui/AppBar';
import CustomScrollbar from '../CustomScrollbar';
import InfoParagraph from './InfoParagraph';
import ThreeStepInfo from './ThreeStepInfo';
import QuickTour from './QuickTour';
import QuickTourSection from './QuickTourSection';
import create_img from '../../../images/3_stage_create.png';
import manage_img from '../../../images/3_stage_manage.png';
import use_img from '../../../images/3_stage_use.png';

import manage_1 from '../../../images/manage_slide_1.png';
import manage_2 from '../../../images/manage_slide_2.png';
import manage_3 from '../../../images/manage_slide_3.png';

import create_1_1 from '../../../images/create_slide_1.png';
import create_1_2 from '../../../images/create_slide_2.png';
import create_1_3 from '../../../images/create_slide_3.png';

import create_2_1 from '../../../images/create_step_2_slide_1.png';
import create_2_2 from '../../../images/create_step_2_slide_2.png';
import create_2_3 from '../../../images/create_step_2_slide_3.png';

import create_3_1 from '../../../images/create_step_3_slide_1.png';
import create_3_2 from '../../../images/create_step_3_slide_2.png';

import create_4_1 from '../../../images/create_status_download_slide_1.png';
import create_4_2 from '../../../images/create_status_download_slide_2.png';

const pageInfo = {
    textParagraphs: [
        {header: 'Overview', body: 'EventKit is blah blah blah'},
        {header: 'What is a DataPack?', body: 'DataPacks are blah blah blah'},
    ],
    threeStep: [
        {img: create_img, caption: 'Create DataPacks'},
        {img: manage_img, caption: 'Manage DataPacks'},
        {img: use_img, caption: 'Use with other open source geospatial software like QGIS'}
    ],
    quickTour: [
        {
            header: 'MANAGE DATAPACKS',
            tourSections: [
                {
                    sectionTitle: 'DataPack Library',
                    steps: [
                        {img: manage_1, caption: 'Here you can create or search, sort, and filter all private an public DataPacks.'}, 
                        {img: manage_2, caption: 'Check the status of previously created DataPacks.'},
                        {img: manage_3, caption: 'Make other actions like "Go to Export Detail" to check export statuses and make downloads.'}
                    ]
                }
            ]
        },
        {
            header: 'CREATE DATAPACKS',
            tourSections: [
                {
                    sectionTitle: 'Step 1: Define Area of Interest',
                    steps: [
                        {img: create_1_1, caption: 'Use your tools to set your Area of Interest.'}, 
                        {img: create_1_2, caption: 'You can cancel or clear your selection using the "X"'},
                        {img: create_1_3, caption: 'Once your area of interest is set, move to the next step with the green right arrow button.'}
                    ]
                },
                {
                    sectionTitle: 'Step 2: Enter General Information',
                    steps: [
                        {img: create_2_1, caption: 'Enter general details and identifying information.'}, 
                        {img: create_2_2, caption: 'Choose your layers.'},
                        {img: create_2_3, caption: 'Use the right green arrow to review your DataPack.'}
                    ]
                },
                {
                    sectionTitle: 'Step 3: Review & Submit',
                    steps: [
                        {img: create_3_1, caption: 'Review your information to make sure it\'s correct.'}, 
                        {img: create_3_2, caption: 'Click the green check mark to submit your DataPack or use the back arrow to edit previous pages.'},
                    ]
                },
                {
                    sectionTitle: 'Get Your Files: Export Status & Download',
                    steps: [
                        {img: create_4_1, caption: 'You\'ll get an e-mail when your files are ready. Use the table to download.'}, 
                        {img: create_4_2, caption: 'You can alse edit your DataPack expiration date an viewing permisions.'},
                    ]
                }
            ]
        },
    ]
}

export class About extends Component {

    constructor(props) {
        super(props);
        this.handleResize = this.handleResize.bind(this);
        this.state = {
            pageInfo: null
        }
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        // later this will be api call --> set state
        this.setState({pageInfo: pageInfo});
    };

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    };

    handleResize() {
        this.forceUpdate();
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
                lineHeight: '30px',
                height: '25px',
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
                    title={'About EventKit'}
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
                >
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{height: window.innerHeight - 130, width: '100%'}}>
                        <div style={styles.bodyContent}>
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
