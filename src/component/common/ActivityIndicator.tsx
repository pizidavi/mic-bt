import { useMemo } from 'react';
import { ActivityIndicator as RNActivityIndicator } from 'react-native';
import { useCSSVariable } from 'uniwind';

type ActivityIndicatorProps = {
  size?: 'small' | 'large';
  color?: 'primary' | 'primary-foreground';
};

/**
 * ActivityIndicator component
 * @param props
 */
function ActivityIndicator(props: ActivityIndicatorProps) {
  const { color = 'primary', ...rest } = props;

  // Hook
  const [colorPrimary, colorPrimaryForeground] = useCSSVariable([
    '--primary',
    '--primary-foreground',
  ] satisfies `--${typeof color}`[]);

  // Memo
  const parsedColor = useMemo(() => {
    switch (color) {
      case 'primary':
        return colorPrimary?.toString();
      case 'primary-foreground':
        return colorPrimaryForeground?.toString();
      default:
        color satisfies never;
    }
  }, [color, colorPrimary, colorPrimaryForeground]);

  // Render
  return <RNActivityIndicator color={parsedColor} {...rest} />;
}

export default ActivityIndicator;
