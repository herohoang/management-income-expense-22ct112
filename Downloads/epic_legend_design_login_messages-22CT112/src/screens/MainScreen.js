import React from "react";
import { View, Text, Button, TouchableOpacity, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MainScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken"); // Xóa token khi đăng xuất
    navigation.replace("LoginScreen");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {/* Icon profile */}
      <TouchableOpacity
        style={{ position: "absolute", top: 40, right: 20 }}
        onPress={() => navigation.navigate("ProfileScreen")}
      >
        <Image
          source={require("../../assets/profile-icon.png")}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      </TouchableOpacity>

      <Text>Chào mừng bạn đến với màn hình chính!</Text>
      <Button title="Đăng xuất" onPress={handleLogout} />
    </View>
  );
};

export default MainScreen;
