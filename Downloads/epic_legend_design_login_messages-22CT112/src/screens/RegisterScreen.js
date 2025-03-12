import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";

const RegisterScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Errors state
  const [fullNameError, setFullNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Define default admin account
  const DEFAULT_ADMIN = {
    email: "admin@gmail.com",
    phoneNumber: "0123456789",
    password: "987654321",
    fullName: "Admin",
  };

  // Check if admin account exists on initial load
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

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhoneNumber = (phone) => /^(0[3|5|7|8|9])([0-9]{8})$/.test(phone);

  const validateForm = () => {
    let isValid = true;
    
    // Reset all error messages
    setFullNameError("");
    setPhoneNumberError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    
    // Validate full name
    if (!fullName.trim()) {
      setFullNameError("Vui lòng nhập họ và tên của bạn");
      isValid = false;
    } else if (fullName.trim().length < 3) {
      setFullNameError("Họ và tên phải có ít nhất 3 ký tự");
      isValid = false;
    }
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      setPhoneNumberError("Vui lòng nhập số điện thoại");
      isValid = false;
    } else if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneNumberError("Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 số)");
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      setEmailError("Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Địa chỉ email không hợp lệ");
      isValid = false;
    }
    
    // Validate password
    if (!password.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      isValid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if email or phone number matches the default admin account
      if (email === DEFAULT_ADMIN.email) {
        setEmailError("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
        setLoading(false);
        return;
      }
      
      if (phoneNumber === DEFAULT_ADMIN.phoneNumber) {
        setPhoneNumberError("Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác.");
        setLoading(false);
        return;
      }

      // Check if email already exists in user data
      const existingUserData = await AsyncStorage.getItem("userData");
      if (existingUserData) {
        const existingUser = JSON.parse(existingUserData);
        if (existingUser.email === email) {
          setEmailError("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
          setLoading(false);
          return;
        }
        
        if (existingUser.phoneNumber === phoneNumber) {
          setPhoneNumberError("Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác.");
          setLoading(false);
          return;
        }
      }

      const newToken = uuid.v4();
      const userData = {
        fullName,
        phoneNumber,
        email,
        password,
        token: newToken,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      await AsyncStorage.setItem("userEmail", email);
      await AsyncStorage.setItem("userToken", newToken);

      Alert.alert(
        "Đăng ký thành công",
        "Chào mừng bạn đến với ứng dụng của chúng tôi!",
        [
          {
            text: "Tiếp tục",
            onPress: () => navigation.replace("MainScreen")
          }
        ]
      );
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
      Alert.alert("Lỗi hệ thống", "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
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
        <View style={styles.header}>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Vui lòng điền đầy đủ thông tin</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={[styles.input, fullNameError ? styles.inputError : null]}
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              if (fullNameError) setFullNameError("");
            }}
            placeholder="Nhập họ và tên của bạn"
          />
          {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, phoneNumberError ? styles.inputError : null]}
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (phoneNumberError) setPhoneNumberError("");
            }}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          {phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError("");
            }}
            placeholder="Nhập địa chỉ email"
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
            placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
            secureTextEntry
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={[styles.input, confirmPasswordError ? styles.inputError : null]}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
          />
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
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
  button: {
    backgroundColor: "#6200EE",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#6200EE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#A79EC0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 10,
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLink: {
    fontSize: 16,
    color: "#6200EE",
    fontWeight: "bold",
  },
});

export default RegisterScreen;