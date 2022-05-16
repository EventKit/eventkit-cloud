import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import { DataPackLinkButton } from '../../components/DataPackPage/DataPackLinkButton';

const getProps = () => ({
    ...(global as any).eventkit_test_props
});

let props;
let wrapper;
const setup = () => {
    props = { ...getProps() };
    wrapper = shallow(<DataPackLinkButton {...props} />);
};

beforeEach(setup);

describe('DataPackLinkButton component', () => {
    it('should render a linked button', () => {
        expect(wrapper.find(Link)).toHaveLength(1);
        expect(wrapper.find(Link).props().to).toEqual(`/create`);
        expect(wrapper.find(Button).html()).toContain('Create DataPack');
        expect(wrapper.find(Button)).toHaveLength(1);
    });
});
