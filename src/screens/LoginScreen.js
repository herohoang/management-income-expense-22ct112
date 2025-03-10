import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (!storedUser) {
        Alert.alert('Tài khoản không tồn tại. Vui lòng đăng ký.');
        return;
      }

      const { email: savedEmail, password: savedPassword, token } = JSON.parse(storedUser);

      if (email === savedEmail && password === savedPassword) {
        await AsyncStorage.setItem('userToken', token); // Lưu token để đăng nhập
        navigation.replace('MainScreen');
      } else {
        Alert.alert('Lỗi', 'Sai email hoặc mật khẩu');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
    }
  };
};

export default LoginScreen;
