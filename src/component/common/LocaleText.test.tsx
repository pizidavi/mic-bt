import { act, render, screen } from '@testing-library/react-native';
import i18next from 'i18next';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import '@/locale';
import { LANGUAGE } from '@/type/enum';
import { testId } from '@/util/test';

import LocaleText from './LocaleText';

beforeAll(async () => {
  await i18next.changeLanguage(LANGUAGE.EN);
});

afterEach(async () => {
  await act(async () => {
    await i18next.changeLanguage(LANGUAGE.EN);
  });
});

describe('LocaleText', () => {
  it('translates the dictionary key', async () => {
    await render(<LocaleText text='home:start' testId={testId('unit-locale-text')} />);

    expect(screen.getByText('Start')).toBeVisible();
    expect(screen.getByText('Start')).toHaveProp('testID', 'unit-locale-text');
  });

  it('renders raw text with avoidTranslation', async () => {
    await render(<LocaleText text='Raw 42' avoidTranslation />);

    expect(screen.getByText('Raw 42')).toBeVisible();
  });

  it('follows the current language', async () => {
    await i18next.changeLanguage(LANGUAGE.IT);

    await render(<LocaleText text='home:stop' />);

    expect(screen.getByText('Ferma')).toBeVisible();
  });

  it('forwards text props', async () => {
    await render(<LocaleText text='general:yes' numberOfLines={2} />);

    expect(screen.getByText('Yes')).toHaveProp('numberOfLines', 2);
  });
});
