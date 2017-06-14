import React, {Component} from 'react';
import AppBar from 'material-ui/AppBar';
import CustomScrollbar from '../CustomScrollbar';
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

export class About extends Component {

    constructor(props) {
        super(props);
        this.handleResize = this.handleResize.bind(this);
    };

    componentWillMount() {
        window.addEventListener('resize', this.handleResize);
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
                            <h4><strong>Overview</strong></h4>
                            <div>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum varius, mauris id accumsan lobortis, augue ex elementum ante, 
                                sit amet luctus odio felis sit amet ex. Nunc congue porttitor libero eu semper. Nunc mauris ipsum, laoreet sit amet ullamcorper at, 
                                feugiat sit amet nisi. Nulla a leo nulla. Ut lacinia nulla quis luctus bibendum. Cras pellentesque dolor risus, 
                                non scelerisque nulla tempus eu. Aliquam consectetur pellentesque nibh. Aenean lobortis aliquet lacus, 
                                at convallis urna tempor scelerisque. Nullam eleifend vulputate felis sit amet feugiat. Donec at dignissim purus, sed tempus augue.
                            </div>
                            <h4 style={{marginTop: '30px'}}><strong>What is a DataPack?</strong></h4>
                            <div>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum varius, mauris id accumsan lobortis, augue ex elementum ante, 
                                sit amet luctus odio felis sit amet ex. Nunc congue porttitor libero eu semper. Nunc mauris ipsum, laoreet sit amet ullamcorper at, 
                                feugiat sit amet nisi. Nulla a leo nulla. Ut lacinia nulla quis luctus bibendum. Cras pellentesque dolor risus, 
                                non scelerisque nulla tempus eu. Aliquam consectetur pellentesque nibh. Aenean lobortis aliquet lacus, 
                                at convallis urna tempor scelerisque. Nullam eleifend vulputate felis sit amet feugiat. Donec at dignissim purus, sed tempus augue.
                            </div>
                            <table style={{borderCollapse: 'collapse', marginTop: '30px', fontSize: window.innerWidth > 991 ? '16px': '14px'}}>
                                <tbody>
                                    <tr>
                                        <td style={{verticalAlign: 'top'}}>
                                            <img 
                                                src={create_img}
                                                style={{display: 'block', width: '95%', marginRight: '5%'}}
                                            />
                                            <div style={{...styles.threeStepCaption, marginRight: '5%'}}>Create DataPacks</div>
                                        </td>
                                        <td style={{verticalAlign: 'top', margin: '0px 5px'}}>
                                            <img 
                                                src={manage_img}
                                                style={{display: 'block', width: '95%', margin: 'auto'}}
                                            />
                                            <div style={{...styles.threeStepCaption, margin: 'auto'}}>Manage DataPacks</div>
                                        </td>
                                        <td style={{verticalAlign: 'top'}}>
                                            <img 
                                                src={use_img}
                                                style={{display: 'block', width: '95%', marginLeft: '5%'}}
                                            />
                                            <div style={{...styles.threeStepCaption, marginLeft: '5%'}}>Use with other open source geospatial software like QGIS</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <h3 style={{marginTop: '60px'}}><strong>Quick Tour</strong></h3>
                            <h4 style={{marginTop: '30px'}}><strong>MANAGE DATAPACKS</strong></h4>
                            <QuickTourSection 
                                steps={[
                                    {img: manage_1, caption: 'Here you can create or search, sort, and filter all private an public DataPacks.'}, 
                                    {img: manage_2, caption: 'Check the status of previously created DataPacks.'},
                                    {img: manage_3, caption: 'Make other actions like "Go to Export Detail" to check export statuses and make downloads.'}
                                ]}
                                sectionTitle={'DataPack Library'}
                            />
                            <h4 style={{marginTop: '60px'}}><strong>CREATE DATAPACKS</strong></h4>
                            <QuickTourSection 
                                steps={[
                                    {img: create_1_1, caption: 'Use your tools to set your Area of Interest.'}, 
                                    {img: create_1_2, caption: 'You can cancel or clear your selection using the "X"'},
                                    {img: create_1_3, caption: 'Once your area of interest is set, move to the next step with the green right arrow button.'}
                                ]}
                                sectionTitle={'Step 1: Define Area of Interest'}
                            />
                            <QuickTourSection 
                                steps={[
                                    {img: create_2_1, caption: 'Enter general details and identifying information.'}, 
                                    {img: create_2_2, caption: 'Choose your layers.'},
                                    {img: create_2_3, caption: 'Use the right green arrow to review your DataPack.'}
                                ]}
                                sectionTitle={'Step 2: Enter General Information'}
                            />
                            <QuickTourSection 
                                steps={[
                                    {img: create_3_1, caption: 'Review your information to make sure it\'s correct.'}, 
                                    {img: create_3_2, caption: 'Click the green check mark to submit your DataPack or use the back arrow to edit previous pages.'},
                                ]}
                                sectionTitle={'Step 3: Review & Submit'}
                            />
                            <QuickTourSection 
                                steps={[
                                    {img: create_4_1, caption: 'You\'ll get an e-mail when your files are ready. Use the table to download.'}, 
                                    {img: create_4_2, caption: 'You can alse edit your DataPack expiration date an viewing permisions.'},
                                ]}
                                sectionTitle={'Get Your Files: Export Status & Download'}
                            />
                        </div>
                    </CustomScrollbar> 
                </div>
            </div>
        )
    };
};

export default About;
