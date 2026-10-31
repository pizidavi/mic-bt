import type { LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import type { TestId } from '../../util/test';

type IconBaseProps = {
  icon: LucideIcon;
  size?: number;
  color?: 'primary' | 'primary-foreground' | 'foreground' | 'muted-foreground' | 'destructive';
  className?: string;
  disabled?: boolean;
};

type IconProps = IconBaseProps &
  ({ onPress: () => void; testId: TestId } | { onPress?: undefined; testId?: TestId });

/**
 * Icon component
 * @param props
 */
function Icon(props: IconProps) {
  const {
    icon: IconComponent,
    size = 24,
    color = 'foreground',
    className,
    onPress,
    testId,
    disabled = false,
  } = props;

  // Hook
  const [
    colorPrimary,
    colorPrimaryForeground,
    colorForeground,
    colorMutedForeground,
    colorDestructive,
  ] = useCSSVariable([
    '--primary',
    '--primary-foreground',
    '--foreground',
    '--muted-foreground',
    '--destructive',
  ] satisfies `--${typeof color}`[]);

  // Memo
  const ContainerComponent = useMemo(() => (onPress ? Pressable : View), [onPress]);

  const iconColor = useMemo(() => {
    switch (color) {
      case 'primary':
        return colorPrimary?.toString() ?? '#fff';
      case 'primary-foreground':
        return colorPrimaryForeground?.toString() ?? '#000';
      case 'foreground':
        return colorForeground?.toString() ?? '#000';
      case 'muted-foreground':
        return colorMutedForeground?.toString() ?? '#888888';
      case 'destructive':
        return colorDestructive?.toString() ?? '#dc2626';
      default:
        color satisfies never;
    }
  }, [
    color,
    colorPrimary,
    colorPrimaryForeground,
    colorForeground,
    colorMutedForeground,
    colorDestructive,
  ]);

  // Render
  return (
    <ContainerComponent
      onPress={onPress}
      testID={testId}
      className={className}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      disabled={disabled}
    >
      <IconComponent size={size} color={iconColor} />
    </ContainerComponent>
  );
}

export default Icon;
