import React from 'react';
import { View, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MainScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken'); // Xóa token khi đăng xuất
    navigation.replace('LoginScreen');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Chào mừng bạn đến với màn hình chính!</Text>
      <Button title="Đăng xuất" onPress={handleLogout} />
    </View>
  );
};

export default MainScreen;
