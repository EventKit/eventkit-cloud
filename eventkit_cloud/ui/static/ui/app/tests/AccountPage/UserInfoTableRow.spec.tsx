import { UserInfoTableRow } from '../../components/AccountPage/UserInfoTableRow';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

describe('UserInfoTableRow component', () => {
    const props = { title: 'test title', data: 'test data', ...(global as any).eventkit_test_props };
    it('should render a table row with title and data cells', () => {
        TestUtils.renderComponent(<UserInfoTableRow {...props} />);
        expect(screen.getByText('test title'));
        expect(screen.getByText('test data'));
    });

    it('should return null if no title or data are passed in', () => {
        const component = TestUtils.renderComponent(<UserInfoTableRow {...props} data={null} />,
            {
                includeToastContainer: false,
            });
        expect(component.container.children).toHaveLength(0);
    });
});
