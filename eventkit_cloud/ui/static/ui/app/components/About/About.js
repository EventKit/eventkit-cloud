import PropTypes from 'prop-types';
import React, { Component } from 'react';
import AppBar from 'material-ui/AppBar';
import CustomScrollbar from '../CustomScrollbar';
import InfoParagraph from './InfoParagraph';
import ThreeStepInfo from './ThreeStepInfo';
import InfoGrid from './InfoGrid';
import { about } from '../../about.config';

const COMPONENT_MAPPING = { InfoParagraph, ThreeStepInfo, InfoGrid };
export class About extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pageInfo: about,
        };
    }

    getComponent(obj) {
        if (!obj.type) return null;
        const InfoComponent = COMPONENT_MAPPING[obj.type];
        return <InfoComponent {...obj} key={`${obj.type}_${obj.title}`} />;
    }

    render() {
        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                padding: '0px 34px',
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
            contact: {
                padding: '10px 34px',
                maxWidth: '1000px',
                margin: 'auto',
                textAlign: 'right',
            },
            bodyContent: {
                padding: '10px 34px 30px',
                maxWidth: '1000px',
                margin: 'auto',
            },
        };

        if (!this.state.pageInfo) {
            return null;
        }

        let version = '';
        let contactUrl = '';
        if (this.context.config) {
            version = this.context.config.VERSION;
            contactUrl = this.context.config.CONTACT_URL;
        }

        return (
            <div style={{ backgroundColor: 'white' }}>
                <AppBar
                    className="qa-About-AppBar"
                    title="About EventKit"
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
                >
                    {version ?
                        <span
                            style={{ height: '35px', lineHeight: '35px' }}
                            className="qa-About-version"
                        >
                            Version {version}
                        </span>
                        :
                        null
                    }
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: window.innerHeight - 130, width: '100%' }}>
                        {contactUrl ?
                            <div style={styles.contact} className="qa-About-contact">
                                <i>Have an issue or suggestion?</i>
                                <br />
                                <a href={contactUrl}>Contact Us</a>
                            </div>
                            :
                            null
                        }
                        <div style={styles.bodyContent} className="qa-About-bodyContent">
                            {this.state.pageInfo.map(obj => (
                                this.getComponent(obj)
                            ))}
                        </div>
                    </CustomScrollbar>
                </div>
            </div>
        );
    }
}

About.contextTypes = {
    config: PropTypes.object,
};

export default About;
