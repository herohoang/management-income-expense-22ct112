import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("userData");
        if (storedUserData) {
          const { fullName, email, phoneNumber } = JSON.parse(storedUserData);
          setFullName(fullName || "Không có họ tên");
          setEmail(email || "Không có email");
          setPhoneNumber(phoneNumber || "Không có số điện thoại");
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/bb.jpg")} style={styles.avatar} />

      <View style={styles.infoContainer}>
        <Text style={styles.title}>Thông tin cá nhân</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>
            <Icon name="user" size={18} color="#6200EE" /> {fullName}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.info}>
            <Icon name="envelope" size={18} color="#6200EE" /> {email}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.info}>
            <Icon name="phone" size={18} color="#6200EE" /> {phoneNumber}
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.description}>
            <Icon name="info-circle" size={18} color="#6200EE" /> Tôi là một
            sinh viên học ngu chuyên dùng chatgpt.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Quay lại màn hình chính</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 10,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6200EE",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#EDE7F6",
    width: "100%",
  },
  info: {
    fontSize: 16,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200EE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProfileScreen;
