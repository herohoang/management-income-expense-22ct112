import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    // Tạo token tự động
    const newToken = uuid.v4();

    // Lưu thông tin tài khoản và token
    const userData = { email, password, token: newToken };
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('userToken', newToken);

    Alert.alert('Đăng ký thành công!', 'Bạn sẽ được chuyển hướng đến màn hình chính.');
    navigation.replace('MainScreen');
  };
};

export default RegisterScreen;
