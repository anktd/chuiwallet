import React, { CSSProperties } from 'react';

import { fontSizes } from '@/ui/theme/font';

interface ImageProps {
  src?: string;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  containerStyle?: CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Image(props: ImageProps) {
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { src, size, width, height, style: $imageStyleOverride, onClick } = props;

  return (
    <img
      src={src}
      alt=""
      style={Object.assign({}, $imageStyleOverride, {
        width: width || size || fontSizes.icon,
        height: height || size || fontSizes.icon
      })}
    />
  );
}
