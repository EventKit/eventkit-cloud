import * as React from "react";
import PageHeader from '../common/PageHeader';
import CustomScrollbar from '../common/CustomScrollbar';
import InfoParagraph from './InfoParagraph';
import ThreeStepInfo from './ThreeStepInfo';
import InfoGrid from './InfoGrid';
import { about } from '../../about.config';
import {useAppContext} from "../ApplicationContext";

const COMPONENT_MAPPING = { InfoParagraph, ThreeStepInfo, InfoGrid };

const About = () => {
    const {VERSION, CONTACT_URL } = useAppContext();

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

    const getComponent = (obj) => {
        if (!obj.type) { return null; }
        const InfoComponent = COMPONENT_MAPPING[obj.type];
        return <InfoComponent {...obj} key={`${obj.type}_${obj.title}`} />;
    };

    return (
        <div style={{ backgroundColor: 'white' }}>
            <PageHeader
                className="qa-About-PageHeader"
                title="About EventKit"
            >
                {VERSION || ''}
            </PageHeader>
            <div style={styles.body}>
                <CustomScrollbar style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                    {CONTACT_URL ?
                        <div style={styles.contact} data-testid={'aboutContact'} className="qa-About-contact">
                            <i>Have an issue or suggestion?</i>
                            <br />
                            <a href={CONTACT_URL || ''}>Contact Us</a>
                        </div>
                        :
                        null
                    }
                    <div style={styles.bodyContent} className="qa-About-bodyContent">
                        {about.map(obj => (
                            getComponent(obj)
                        ))}
                    </div>
                </CustomScrollbar>
            </div>
        </div>
    );
};

export default About;
