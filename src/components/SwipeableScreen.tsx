import React, { useRef } from 'react';
import { View, Animated, Dimensions, PanResponder } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SwipeableScreenProps {
  children: React.ReactNode;
  onSwipeFromLeft?: () => void;
  swipeThreshold?: number;
  edgeWidth?: number;
}

export const SwipeableScreen: React.FC<SwipeableScreenProps> = ({
  children,
  onSwipeFromLeft,
  swipeThreshold = 100,
  edgeWidth = 30,
}) => {
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX, dx } = gestureState;
        // 左端からのスワイプかつ右方向への移動の場合のみ反応
        return pageX <= edgeWidth && dx > 10;
      },
      onPanResponderGrant: () => {
        // タッチ開始時
      },
      onPanResponderMove: () => {
        // 移動中
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        // 右にスワイプした場合、または速度が十分な場合
        if (dx > swipeThreshold || vx > 0.5) {
          onSwipeFromLeft?.();
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default SwipeableScreen;