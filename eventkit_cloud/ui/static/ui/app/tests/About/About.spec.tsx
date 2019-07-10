import * as React from 'react';
import { shallow } from 'enzyme';
import { About } from '../../components/About/About';
import { about } from '../../about.config';
import PageHeader from '../../components/common/PageHeader';
import InfoParagraph from '../../components/About/InfoParagraph';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import InfoGrid from '../../components/About/InfoGrid';
import CustomScrollbar from '../../components/CustomScrollbar';

describe('About component', () => {
    function getWrapper(config) {
        return shallow(<About {...(global as any).eventkit_test_props} />, {
            context: { config }
        });
    }

    it('should render all the basic elements', () => {
        const mapping = { InfoParagraph: 0, ThreeStepInfo: 0, InfoGrid: 0 };
        about.forEach((item) => { mapping[item.type] += 1; });
        const wrapper = getWrapper({});
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(InfoParagraph)).toHaveLength(mapping.InfoParagraph);
        expect(wrapper.find(ThreeStepInfo)).toHaveLength(mapping.ThreeStepInfo);
        expect(wrapper.find(InfoGrid)).toHaveLength(mapping.InfoGrid);
    });

    it('should not show the version tag if no version in context', () => {
        const wrapper = getWrapper({});
        expect(wrapper.find(PageHeader).props().children).toEqual('');
    });

    it('should not show the contact link if no contact url in context', () => {
        const wrapper = getWrapper({});
        expect(wrapper.find('.qa-About-contact')).toHaveLength(0);
    });

    it('should render the version tag', () => {
        this.context.config.VERSION = '1.3.0';
        const wrapper = getWrapper({});
        expect(wrapper.find(PageHeader).props().children).toEqual('1.3.0');
    });

    it('should show the contact link', () => {
        this.context.config.CONTACT_URL = 'something';
        const wrapper = getWrapper({});
        expect(wrapper.find('.qa-About-contact')).toHaveLength(1);
    });

    it('should render null if no pageInfo', () => {
        const wrapper = getWrapper({});
        wrapper.setState({ pageInfo: null });
        wrapper.instance().forceUpdate();
        wrapper.update();
        expect(wrapper.type()).toBe(null);
    });
});
