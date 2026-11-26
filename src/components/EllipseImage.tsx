import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';

type Props = {
  source: ImageSourcePropType;
  /** Ellipse width in points. */
  width: number;
  /** The image's height ÷ width; the ellipse uses the same proportions so the whole image shows. */
  aspectRatio: number;
  borderColor?: string;
  borderWidth?: number;
};

/**
 * Shows a whole image inside an ellipse with the image's own proportions.
 * borderRadius can't draw a true ellipse on a non-square box, so we clip with
 * a circle stretched vertically (scaleY) and counter-scale the image inside it.
 */
export function EllipseImage({ source, width, aspectRatio, borderColor, borderWidth = 0 }: Props) {
  const height = width * aspectRatio;

  return (
    <View style={[styles.frame, { width, height }]}>
      <View
        style={[
          styles.clip,
          {
            width,
            height: width,
            borderRadius: width / 2,
            borderColor,
            borderWidth,
            transform: [{ scaleY: aspectRatio }],
          },
        ]}
      >
        <Image
          source={source}
          resizeMode="cover"
          style={{
            position: 'absolute',
            left: 0,
            top: (width - height) / 2,
            width,
            height,
            transform: [{ scaleY: 1 / aspectRatio }],
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  clip: { overflow: 'hidden' },
});
