import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import axios, { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';

type LoginScreenNavigation = StackNavigationProp<RootStackParamList, 'Login'>;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<LoginScreenNavigation>();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userId = await AsyncStorage.getItem('userId');
      const email = await AsyncStorage.getItem('email');

      if (isLoggedIn === 'true' && userId && email) {
        // ถ้ามีการล็อกอินอยู่ นำทางไปยังหน้า Home
        navigation.navigate('Home', {
          email: email,
          _id: userId,
        });
      }
    } catch (error) {
      console.log('Error checking login status:', error);
    }
  };


  const handleLogin = async () => {
    try {
      const response = await axios.post('https://backend-smartcash.vercel.app/login', {
        email,
        password,
      });
  
      // เก็บข้อมูลทั้งหมดที่จำเป็นใน AsyncStorage
      await AsyncStorage.setItem('userId', response.data.userId);
      await AsyncStorage.setItem('email', response.data.email);
      await AsyncStorage.setItem('isLoggedIn', 'true');
  
      Alert.alert('สำเร็จ', response.data.message);
      navigation.navigate('Home', {
        email: response.data.email,
        _id: response.data.userId,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log('Error Response:', error.response?.data);
        Alert.alert('ข้อผิดพลาด', error.response?.data?.message || 'ไม่สามารถเข้าสู่ระบบได้');
      } else {
        console.log('Unexpected Error:', error);
        Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดที่ไม่คาดคิด');
      }
    }
  };
    
    
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SMART CASH</Text>
      <TextInput
        style={styles.input}
        placeholder="อีเมล"
        placeholderTextColor="#D5D3D3"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="รหัสผ่าน"
        placeholderTextColor="#D5D3D3"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C8EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginBottom: 40,
    color: '#09006B',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#00000',
    marginBottom: 20,
  },
  button: {
    width: '80%',
    height: 50,
    backgroundColor: '#3483B5',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Login;
