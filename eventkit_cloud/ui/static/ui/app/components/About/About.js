import React, {Component} from 'react';
import AppBar from 'material-ui/AppBar';
import CustomScrollbar from '../CustomScrollbar';
import QuickTourSection from './QuickTourSection';
import test from '../../../images/about_screen_shot.png';
import test2 from '../../../images/about_screen_shot2.png';

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
                padding: '30px 34px',
                maxWidth: '1000px', 
                margin: 'auto'
            },
            
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
                            <div style={{marginBottom: '30px'}}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum varius, mauris id accumsan lobortis, augue ex elementum ante, 
                                sit amet luctus odio felis sit amet ex. Nunc congue porttitor libero eu semper. Nunc mauris ipsum, laoreet sit amet ullamcorper at, 
                                feugiat sit amet nisi. Nulla a leo nulla. Ut lacinia nulla quis luctus bibendum. Cras pellentesque dolor risus, 
                                non scelerisque nulla tempus eu. Aliquam consectetur pellentesque nibh. Aenean lobortis aliquet lacus, 
                                at convallis urna tempor scelerisque. Nullam eleifend vulputate felis sit amet feugiat. Donec at dignissim purus, sed tempus augue.
                            </div>
                            <h4><strong>What is a DataPack?</strong></h4>
                            <div style={{marginBottom: '30px'}}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum varius, mauris id accumsan lobortis, augue ex elementum ante, 
                                sit amet luctus odio felis sit amet ex. Nunc congue porttitor libero eu semper. Nunc mauris ipsum, laoreet sit amet ullamcorper at, 
                                feugiat sit amet nisi. Nulla a leo nulla. Ut lacinia nulla quis luctus bibendum. Cras pellentesque dolor risus, 
                                non scelerisque nulla tempus eu. Aliquam consectetur pellentesque nibh. Aenean lobortis aliquet lacus, 
                                at convallis urna tempor scelerisque. Nullam eleifend vulputate felis sit amet feugiat. Donec at dignissim purus, sed tempus augue.
                            </div>
                            <table style={{borderCollapse: 'collapse', marginBottom: '30px'}}>
                                <tbody>
                                    <tr>
                                        <td style={{verticalAlign: 'top'}}>
                                            <img 
                                                src={test2}
                                                style={{display: 'block', width: '95%', marginRight: '5%'}}
                                            />
                                            <div style={{backgroundColor: '#4598bf', padding: '5px', color: '#fff', minHeight: '50px', width: '95%', marginRight: '5%'}}>Create DataPacks</div>
                                        </td>
                                        <td style={{verticalAlign: 'top', margin: '0px 5px'}}>
                                            <img 
                                                src={test2}
                                                style={{display: 'block', width: '95%', margin: 'auto'}}
                                            />
                                            <div style={{backgroundColor: '#4598bf', padding: '5px', color: '#fff', minHeight: '50px', width: '95%', margin: 'auto'}}>Manage DataPacks</div>
                                        </td>
                                        <td style={{verticalAlign: 'top'}}>
                                            <img 
                                                src={test2}
                                                style={{display: 'block', width: '95%', marginLeft: '5%'}}
                                            />
                                            <div style={{backgroundColor: '#4598bf', padding: '5px', color: '#fff', minHeight: '50px', width: '95%', marginLeft: '5%'}}>Use with other open source geospatial software like QGIS</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <h3 style={{margin: '30px 0px'}}>Quick Tour</h3>
                            <h4>MANAGE DATAPACKS</h4>
                            <QuickTourSection 
                                steps={[
                                    {img: test, caption: 'Here you can create or search, sort, and filter all private an public datapacks'}, 
                                    {img: test2, caption: 'Check the status of previously created datapacks'}
                                ]}
                                sectionTitle={'DataPack Library'}
                            />
                        </div>
                    </CustomScrollbar> 
                </div>
            </div>
        )
    };
};

About.PropTypes = {

}

export default About;
