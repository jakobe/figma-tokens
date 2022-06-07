import { TokenSetStatus } from '@/constants/TokenSetStatus';
import { UrlTokenStorage } from '../UrlTokenStorage';

describe('Test URLTokenStorage', () => {
  const urlTokenStorage = new UrlTokenStorage('', '');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array when the content(s) are invalid', async () => {
    global.fetch = jest.fn(() => (
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(''),
      }) as Promise<Response>
    ));

    const result = await urlTokenStorage.read();
    expect(result).toEqual([]);
  });

  it('should return themes and token sets', async () => {
    global.fetch = jest.fn(() => (
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          values: {
            global: {
              colors: {
                background: {
                  type: 'color',
                  value: '#000000',
                },
              },
            },
            light: {
              colors: {
                background: {
                  type: 'color',
                  value: '#ffffff',
                },
              },
            },
          },
          $themes: [{
            id: 'light',
            name: 'Light',
            selectedTokenSets: {
              global: TokenSetStatus.SOURCE,
              light: TokenSetStatus.ENABLED,
            },
          }],
        }),
      }) as Promise<Response>
    ));

    const result = await urlTokenStorage.read();

    expect(result).toEqual([
      {
        type: 'themes',
        path: '$themes.json',
        data: [
          {
            id: 'light',
            name: 'Light',
            selectedTokenSets: {
              global: TokenSetStatus.SOURCE,
              light: TokenSetStatus.ENABLED,
            },
          },
        ],
      },
      {
        name: 'global',
        type: 'tokenSet',
        path: 'global.json',
        data: {
          colors: {
            background: {
              type: 'color',
              value: '#000000',
            },
          },
        },
      },
      {
        name: 'light',
        type: 'tokenSet',
        path: 'light.json',
        data: {
          colors: {
            background: {
              type: 'color',
              value: '#ffffff',
            },
          },
        },
      },
    ]);
  });
});
