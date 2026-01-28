import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from 'expo/vector-icons';

interface AnimatedHostelIconProps {
  size?: number;
  color?: string;
  delay?: number;
}

const AnimatedHostelIcon: React.FC<AnimatedHostelIconProps> = ({
  size = 80,
  color = '#FF8C00',
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(bounceAnim, {
                toValue: -10,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();
    };

    startAnimation();
  }, [scaleAnim, rotateAnim, bounceAnim, delay]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate },
              { translateY: bounceAnim },
            ],
          },
        ]}
      >
        <MaterialIcons name="home" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedHostelIcon;
