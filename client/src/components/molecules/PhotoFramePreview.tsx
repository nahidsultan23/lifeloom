import { useState } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { FRAME, fitInFrame, type UploadPurpose } from '../../lib/limits';
import { radius, spacing, useTheme } from '../../theme';
import { t } from '../../strings';
import { AppText } from '../atoms/AppText';

interface Props {
  uri: string;
  width: number;
  height: number;
  purpose: UploadPurpose;
}

/**
 * Shows the photo the way the server will store it: whole photo inside the
 * required frame, never cropped, scaled uniformly, leftover space split evenly
 * and filled with the app surface color. The server does the real framing.
 */
export function PhotoFramePreview({ uri, width, height, purpose }: Props) {
  const colors = useTheme();
  const frame = FRAME[purpose];
  const [frameWidth, setFrameWidth] = useState(0);
  const frameHeight = frameWidth / frame.ratio;
  const fit = fitInFrame({ width, height }, { width: frameWidth, height: frameHeight });

  const onLayout = (event: LayoutChangeEvent) => setFrameWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.wrap}>
      <View
        onLayout={onLayout}
        accessible
        accessibilityLabel={t.attachments.previewLabel(frame.label)}
        style={[
          styles.frame,
          { aspectRatio: frame.ratio, backgroundColor: colors.frame, borderColor: colors.border },
        ]}
      >
        {frameWidth > 0 ? (
          <Image
            source={{ uri }}
            resizeMode="contain"
            style={{
              position: 'absolute',
              left: fit.x,
              top: fit.y,
              width: fit.width,
              height: fit.height,
            }}
          />
        ) : null}
      </View>
      <AppText variant="caption" muted>
        {t.attachments.requiredRatio(frame.label)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  frame: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
