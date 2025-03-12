import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Define default admin account
  const DEFAULT_ADMIN = {
    email: "admin@gmail.com",
    phoneNumber: "0123456789",
    password: "987654321",
    fullName: "Admin",
  };

  // Setup default admin account on component mount
  useEffect(() => {
    const setupDefaultAdmin = async () => {
      try {
        const existingAdmin = await AsyncStorage.getItem("adminAccountCreated");

        if (!existingAdmin) {
          const adminToken = uuid.v4();
          const adminData = {
            ...DEFAULT_ADMIN,
            token: adminToken,
            createdAt: new Date().toISOString(),
          };

          // Store admin data
          await AsyncStorage.setItem("adminData", JSON.stringify(adminData));
          await AsyncStorage.setItem("adminAccountCreated", "true");
          console.log("Default admin account created");
        }
      } catch (error) {
        console.error("Error setting up default admin:", error);
      }
    };

    setupDefaultAdmin();
  }, []);

  const validateInputs = () => {
    let isValid = true;
    
    // Reset previous errors
    setEmailError("");
    setPasswordError("");
    
    // Validate email
    if (!email.trim()) {
      setEmailError("Vui lòng nhập email của bạn");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email không hợp lệ");
      isValid = false;
    }
    
    // Validate password
    if (!password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      isValid = false;
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    // Validate inputs first
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Check if it's the admin account
      const adminDataString = await AsyncStorage.getItem("adminData");
      if (adminDataString) {
        const adminData = JSON.parse(adminDataString);
        
        if (email === adminData.email && password === adminData.password) {
          // Admin login successful
          await AsyncStorage.setItem("userToken", adminData.token);
          await AsyncStorage.setItem("isAdmin", "true");
          
          setLoading(false);
          Alert.alert(
            "Đăng nhập thành công", 
            "Chào mừng Admin đã quay trở lại!",
            [
              { 
                text: "Tiếp tục", 
                onPress: () => navigation.replace("MainScreen") 
              }
            ]
          );
          return;
        }
      }
      
      // Regular user login
      const storedUser = await AsyncStorage.getItem("userData");
      
      if (!storedUser) {
        setLoading(false);
        Alert.alert(
          "Tài khoản không tồn tại", 
          "Email này chưa được đăng ký trong hệ thống",
          [
            { 
              text: "Đăng ký", 
              onPress: () => navigation.navigate("RegisterScreen") 
            },
            { 
              text: "Thử lại", 
              style: "cancel" 
            }
          ]
        );
        return;
      }
      
      const parsedUser = JSON.parse(storedUser);
      const {
        email: savedEmail,
        password: savedPassword,
        token,
      } = parsedUser || {};
      
      if (!token) {
        setLoading(false);
        Alert.alert("Lỗi hệ thống", "Dữ liệu người dùng không hợp lệ. Vui lòng liên hệ hỗ trợ.");
        return;
      }
      
      if (email !== savedEmail) {
        setLoading(false);
        setEmailError("Email không tồn tại trong hệ thống");
        return;
      }
      
      if (password !== savedPassword) {
        setLoading(false);
        setPasswordError("Mật khẩu không chính xác");
        return;
      }
      
      // Login successful
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("isAdmin", "false");
      
      // Clear any previous errors
      setEmailError("");
      setPasswordError("");
      
      Alert.alert(
        "Đăng nhập thành công", 
        "Chào mừng bạn quay trở lại!",
        [
          { 
            text: "Tiếp tục", 
            onPress: () => navigation.replace("MainScreen") 
          }
        ]
      );
      
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      Alert.alert("Lỗi kết nối", "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Đăng nhập</Text>
        </View>
        
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            placeholder="Nhập email của bạn"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
            placeholder="Nhập mật khẩu của bạn"
            secureTextEntry
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("RegisterScreen")}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6200EE",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  inputError: {
    borderColor: "#ff3b30",
    backgroundColor: "#fff0f0",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    marginBottom: 15,
    marginTop: -5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#6200EE",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#6200EE",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#6200EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#A79BCC",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
  },
  footerText: {
    fontSize: 16,
    color: "#666",
  },
  linkText: {
    fontSize: 16,
    color: "#6200EE",
    fontWeight: "bold",
  },
});

export default LoginScreen;