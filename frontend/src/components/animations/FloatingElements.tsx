import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface FloatingElement {
  id: number;
  emoji: string;
  size: number;
  color: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const FloatingElements: React.FC = () => {
  const animatedValues = useRef(
    Array.from({ length: 8 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const elements: FloatingElement[] = [
    {
      id: 1,
      emoji: '🛏️',
      size: 24,
      color: '#FF8C00',
      startX: width * 0.1,
      startY: height * 0.8,
      endX: width * 0.3,
      endY: height * 0.2,
      duration: 4000,
      delay: 0,
    },
    {
      id: 2,
      emoji: '🔑',
      size: 20,
      color: '#007AFF',
      startX: width * 0.9,
      startY: height * 0.7,
      endX: width * 0.7,
      endY: height * 0.3,
      duration: 3500,
      delay: 500,
    },
    {
      id: 3,
      emoji: '🛡️',
      size: 22,
      color: '#00CED1',
      startX: width * 0.2,
      startY: height * 0.9,
      endX: width * 0.5,
      endY: height * 0.1,
      duration: 4500,
      delay: 1000,
    },
    {
      id: 4,
      emoji: '⭐',
      size: 18,
      color: '#FFD700',
      startX: width * 0.8,
      startY: height * 0.85,
      endX: width * 0.6,
      endY: height * 0.15,
      duration: 3800,
      delay: 1500,
    },
    {
      id: 5,
      emoji: '📶',
      size: 20,
      color: '#32CD32',
      startX: width * 0.05,
      startY: height * 0.75,
      endX: width * 0.4,
      endY: height * 0.25,
      duration: 4200,
      delay: 2000,
    },
    {
      id: 6,
      emoji: '🍽️',
      size: 22,
      color: '#FF6347',
      startX: width * 0.95,
      startY: height * 0.8,
      endX: width * 0.8,
      endY: height * 0.2,
      duration: 3900,
      delay: 2500,
    },
    {
      id: 7,
      emoji: '🚗',
      size: 20,
      color: '#8A2BE2',
      startX: width * 0.15,
      startY: height * 0.85,
      endX: width * 0.35,
      endY: height * 0.35,
      duration: 4100,
      delay: 3000,
    },
    {
      id: 8,
      emoji: '❤️',
      size: 16,
      color: '#FF69B4',
      startX: width * 0.85,
      startY: height * 0.9,
      endX: width * 0.75,
      endY: height * 0.4,
      duration: 3600,
      delay: 3500,
    },
  ];

  useEffect(() => {
    const startAnimations = () => {
      elements.forEach((element, index) => {
        const anim = animatedValues[index];

        Animated.sequence([
          Animated.delay(element.delay),
          Animated.parallel([
            Animated.timing(anim.translateX, {
              toValue: element.endX - element.startX,
              duration: element.duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: element.endY - element.startY,
              duration: element.duration,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 1,
              tension: 40,
              friction: 3,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0.7,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    };

    startAnimations();
  }, [animatedValues, elements]);

  return (
    <View style={styles.container}>
      {elements.map((element, index) => {
        const anim = animatedValues[index];
        return (
          <Animated.View
            key={element.id}
            style={[
              styles.element,
              {
                left: element.startX,
                top: element.startY,
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                  { scale: anim.scale },
                ],
                opacity: anim.opacity,
              },
            ]}
          >
            <Text style={[styles.emoji, { fontSize: element.size, color: element.color }]}>
              {element.emoji}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  element: {
    position: 'absolute',
  },
  emoji: {
    textAlign: 'center',
  },
});

export default FloatingElements;
