import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import AppBar from 'material-ui/AppBar';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import About from '../../components/About/About';
import { Config } from '../../config';
import InfoParagraph from '../../components/About/InfoParagraph';
import ThreeStepInfo from '../../components/About/ThreeStepInfo';
import InfoGrid from '../../components/About/InfoGrid';
import CustomScrollbar from '../../components/CustomScrollbar';


describe('About component', () => {
    const muiTheme = getMuiTheme();
    const getWrapper = () => {
        return mount(<About />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: PropTypes.object },
        });
    };

    it('should render all the basic elements', () => {
        const mapping = { InfoParagraph: 0, ThreeStepInfo: 0, InfoGrid: 0 };
        Config.ABOUT_PAGE.forEach((item) => { mapping[item.type] += 1; });
        const wrapper = getWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).text()).toEqual('About EventKit');
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(InfoParagraph)).toHaveLength(mapping.InfoParagraph);
        expect(wrapper.find(ThreeStepInfo)).toHaveLength(mapping.ThreeStepInfo);
        expect(wrapper.find(InfoGrid)).toHaveLength(mapping.InfoGrid);
    });

    it('should not show the version tag if no version in context', () => {
        const wrapper = getWrapper();
        expect(wrapper.find('.qa-About-version')).toHaveLength(0);
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
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object,
            },
        });
        expect(wrapper.find('.qa-About-version')).toHaveLength(1);
        expect(wrapper.find('.qa-About-version').text()).toEqual('Version 1.2.3');
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
