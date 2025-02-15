import React from 'react';
import { cleanup, render, waitFor, fireEvent, act, configure } from '@testing-library/react';

import AppPage from '../src/AppPage';
import mockProps from './mockProps';
import projectData from './mockData/project.json';
import contentTypesData from './mockData/contentTypes.json';
import { vi } from 'vitest';

const basicProps = {
  openAuth: () => {},
  accessToken: '',
  client: {
    getProjects: () => Promise.resolve(projectData),
  },
  sdk: mockProps.sdk,
};

configure({ testIdAttribute: 'data-test-id' });

describe('AppPage', () => {
  afterEach(cleanup);
  // There is potentially a bug with @testing-library/react here. The order that these tests run
  // actually seems to matter. I tried calling `cleanup` in various ways but it didn't work.
  // This test must run before the other unfortunately.
  it('should render the Optimizely config and allow for adding content types', async () => {
    let configFunc = null;

    const sdk = {
      ...basicProps.sdk,
      space: {
        getContentTypes: vi.fn(() => Promise.resolve(contentTypesData)),
        updateContentType: () => {},
      },
      app: {
        setReady: vi.fn(),
        getParameters: vi.fn(() => Promise.resolve({ optimizelyProjectId: '123' })),
        onConfigure: vi.fn((fn) => {
          configFunc = fn;
        }),
        onConfigurationCompleted: () => {},
      },
    };

    const props = { ...basicProps, accessToken: '123', sdk };

    const { container, getByTestId } = render(<AppPage {...props} />);

    await waitFor(() => {
      if (!configFunc) {
        throw '';
      }
    });

    await configFunc();
    expect(container);

    act(() => {
      fireEvent.click(getByTestId('add-content'));
    });

    // first we select the `select` element
    getByTestId('content-type-selector').click();
    // then we select the first `option` element
    getByTestId('content-type-selector').firstChild.click();

    expect(getByTestId('content-type-selector'));
  });

  it('should render the AppPage with Features and connect button', () => {
    const sdk = {
      ...basicProps.sdk,
      space: {
        getContentTypes: vi.fn(() => Promise.resolve(contentTypesData)),
      },
      app: {
        setReady: vi.fn(),
        getParameters: vi.fn(() => Promise.resolve({ optimizelyProjectId: '123' })),
        onConfigure: vi.fn((fn) => {}),
        onConfigurationCompleted: () => {},
      },
    };
    const props = { ...basicProps, sdk };
    const { getByText } = render(<AppPage {...props} />);

    expect(getByText(/Connect Optimizely/)).toBeDefined();
  });

  it('should render the AppPage loading when first connected to Optimizely', () => {
    const sdk = {
      ...basicProps.sdk,
      space: {
        getContentTypes: vi.fn(() => Promise.resolve(contentTypesData)),
      },
      app: {
        setReady: vi.fn(),
        getParameters: vi.fn(() => Promise.resolve({ optimizelyProjectId: '123' })),
        onConfigure: vi.fn((fn) => {}),
        onConfigurationCompleted: () => {},
      },
    };
    const props = { ...basicProps, accessToken: '123', sdk };

    const { getByText } = render(<AppPage {...props} />);

    expect(getByText(/currently connected to Optimizely/)).toBeDefined();
  });
});
