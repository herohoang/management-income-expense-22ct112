import React from "react";
import { View, Text, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";

const MainScreen = ({ navigation }) => {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken"); // Xóa token khi đăng xuất
    navigation.replace("LoginScreen");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Chào mừng bạn đến với màn hình chính!</Text>

      {/* Biểu đồ thống kê thu chi */}
      <LineChart
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [{ data: [500, 700, 800, 650, 900, 1100] }],
        }}
        width={Dimensions.get("window").width - 30}
        height={220}
        yAxisLabel="$"
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        }}
        style={{ marginVertical: 10, borderRadius: 16 }}
      />

      <Button title="Đăng xuất" onPress={handleLogout} />
    </View>
  );
};

export default MainScreen;
