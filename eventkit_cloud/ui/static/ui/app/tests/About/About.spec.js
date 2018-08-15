import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import About from '../../components/About/About';
import { about } from '../../about.config';
import PageHeader from '../../components/common/PageHeader';
import InfoParagraph from '../../components/About/InfoParagraph';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import InfoGrid from '../../components/About/InfoGrid';
import CustomScrollbar from '../../components/CustomScrollbar';


describe('About component', () => {
    const muiTheme = getMuiTheme();
    const getWrapper = () => (
        mount(<About />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        })
    );

    it('should render all the basic elements', () => {
        const mapping = { InfoParagraph: 0, ThreeStepInfo: 0, InfoGrid: 0 };
        about.forEach((item) => { mapping[item.type] += 1; });
        const wrapper = getWrapper();
        expect(wrapper.find(PageHeader)).toHaveLength(1);
        expect(wrapper.find(PageHeader).text()).toEqual('About EventKit');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(InfoParagraph)).toHaveLength(mapping.InfoParagraph);
        expect(wrapper.find(ThreeStepInfo)).toHaveLength(mapping.ThreeStepInfo);
        expect(wrapper.find(InfoGrid)).toHaveLength(mapping.InfoGrid);
    });

    it('should not show the version tag if no version in context', () => {
        const wrapper = getWrapper();
        expect(wrapper.find(PageHeader).props().children).toEqual('');
    });

    it('should not show the contact link if no contact url in context', () => {
        const wrapper = getWrapper();
        expect(wrapper.find('.qa-About-contact')).toHaveLength(0);
    });

    it('should render the version tag', () => {
        const config = { VERSION: '1.2.3' };
        const wrapper = mount(<About />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: PropTypes.object,
                config: PropTypes.object,
            },
        });
        expect(wrapper.find(PageHeader).props().children).toEqual('1.2.3');
    });

    it('should render the contact url', () => {
        const config = { CONTACT_URL: 'some url' };
        const wrapper = mount(<About />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: PropTypes.object,
                config: PropTypes.object,
            },
        });
        expect(wrapper.find('.qa-About-contact')).toHaveLength(1);
        expect(wrapper.find('.qa-About-contact').text()).toEqual('Have an issue or suggestion?Contact Us');
    });
});
