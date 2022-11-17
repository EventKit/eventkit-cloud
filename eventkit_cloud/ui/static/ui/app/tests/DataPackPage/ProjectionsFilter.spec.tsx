import * as React from "react";
import * as sinon from 'sinon';
import { screen } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';
import {ProjectionsFilter} from "../../components/DataPackPage/ProjectionsFilter";


describe('ProjectionsFilter component', () => {
    const projections = [
        {
            srid: 4326,
            name: 'EPSG:4326',
            description: null,
        },
        {
            srid: 3857,
            name: 'EPSG:3857',
            description: null,
        }
    ];
    const getProps = () => ({
        projections,
        selected: {},
        onChange: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

   it('should render basic components', () => {
       const props = getProps();
       TestUtils.renderComponent(<ProjectionsFilter {...props} />)

       expect(screen.queryAllByText(/EPSG/i));
   });

});
