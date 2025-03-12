import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const Chart = () => {
  console.log("Chart component is rendering..."); // Kiểm tra xem component có được gọi không

  return (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ textAlign: "center", marginBottom: 10 }}>Biểu đồ thu chi</Text>
  </View>
  );
};

export default Chart;
