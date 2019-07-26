import * as PropTypes from 'prop-types';
import * as React from 'react';
import PageHeader from '../common/PageHeader';
import CustomScrollbar from '../CustomScrollbar';
import InfoParagraph from './InfoParagraph';
import ThreeStepInfo from './ThreeStepInfo';
import InfoGrid from './InfoGrid';
import { about } from '../../about.config';

const COMPONENT_MAPPING = { InfoParagraph, ThreeStepInfo, InfoGrid };

export interface State {
    pageInfo: object[];
}

export class About extends React.Component<State> {
    static contextTypes = {
        config: PropTypes.shape({
            VERSION: PropTypes.string,
            LOGIN_DISCLAIMER: PropTypes.string,
        }),
    };

    state = {
        pageInfo: about,
    };

    private getComponent(obj) {
        if (!obj.type) { return null; }
        const InfoComponent = COMPONENT_MAPPING[obj.type];
        return <InfoComponent {...obj} key={`${obj.type}_${obj.title}`} />;
    }

    render() {
        const styles = {
            body: {
                height: 'calc(100vh - 130px)',
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden' as 'hidden',
            },
            contact: {
                padding: '10px 34px',
                maxWidth: '1000px',
                margin: 'auto',
                textAlign: 'right' as 'right',
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
                <PageHeader
                    className="qa-About-PageHeader"
                    title="About EventKit"
                >
                    {version}
                </PageHeader>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
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

export default About;
