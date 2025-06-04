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
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX, dx, dy } = gestureState;
        // より厳密な条件：左端から開始、水平移動優先、十分な水平移動距離
        return pageX <= edgeWidth && 
               dx > 20 && 
               Math.abs(dx) > Math.abs(dy) * 2 &&
               Math.abs(dy) < 30;
      },
      onPanResponderTerminationRequest: () => true, // 他のコンポーネントがコントロールを要求した場合は許可
      onPanResponderGrant: () => {
        // タッチ開始時
      },
      onPanResponderMove: () => {
        // 移動中
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx, pageX } = gestureState;
        // より厳密な条件で実行
        if ((dx > swipeThreshold || vx > 0.7) && pageX <= edgeWidth) {
          onSwipeFromLeft?.();
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: edgeWidth, zIndex: 1 }} {...panResponder.panHandlers} />
      {children}
    </View>
  );
};

export default SwipeableScreen;