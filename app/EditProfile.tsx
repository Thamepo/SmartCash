import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import { TextInput, Button, Provider as PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  ShopName: string;
  ShopCode: string;
  employees: string[];
}

interface UpdateUserData extends UserData {
  currentPassword?: string;
  newPassword?: string;
}

interface ApiResponse {
  success: boolean;
  data?: UserData;
  message?: string;
}

const API_URL = 'https://backend-smartcash.vercel.app/'; 

const EditProfile = () => {
  const navigation = useNavigation();
  const [ShopCode, setShopCode] = useState('');
  const [ShopName, setShopName] = useState('');
  const [employees, setEmployees] = useState(['']);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);
  // useEffect(() => {
  //   const checkUserId = async () => {
  //     const userId = await AsyncStorage.getItem('userId');
  //     console.log('Current userId:', userId);
  //   };
  //   checkUserId();
  // }, []);
  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      const response = await axios.get<ApiResponse>(`${API_URL}/users/${userId}`);
      const { data } = response.data;
      
      if (data) {
        setShopCode(data.ShopCode || '');
        setShopName(data.ShopName || '');
        setEmployees(data.employees?.length > 0 ? data.employees : ['']);
      }
      
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Error fetching user data:', axiosError);
      Alert.alert('Error', 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
        Alert.alert('Error', 'กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง');
        return;
      }

      const userData: UpdateUserData = {
        ShopName,
        ShopCode,
        employees: employees.filter(emp => emp.trim() !== ''),
      };

      if (currentPassword && newPassword) {
        userData.currentPassword = currentPassword;
        userData.newPassword = newPassword;
      }

      const response = await axios.put<ApiResponse>(`${API_URL}/users/${userId}`, userData);

      if (response.data.success) {
        Alert.alert('Success', 'อัพเดตข้อมูลสำเร็จ');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'ไม่สามารถอัพเดตข้อมูลได้');
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      console.error('Error updating user data:', axiosError);
      Alert.alert(
        'Error',
        axiosError.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดตข้อมูล'
      );
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = () => {
    setEmployees([...employees, '']);
  };

  const removeEmployee = (index: number) => {
    const newEmployees = employees.filter((_, i) => i !== index);
    setEmployees(newEmployees);
  };

  const handleEmployeeChange = (text: string, index: number) => {
    const newEmployees = [...employees];
    newEmployees[index] = text;
    setEmployees(newEmployees);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2457C5" />
            <Text style={styles.backText}>ย้อนกลับ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.title}>ข้อมูลผู้ใช้</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>รหัสร้านค้า</Text>
              <TextInput
                mode="outlined"
                placeholder="รหัสร้านค้า"
                value={ShopCode}
                onChangeText={setShopCode}
                style={styles.input}
                outlineColor="#E5E7EB"
                activeOutlineColor="#2457C5"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>ชื่อร้านค้า</Text>
              <TextInput
                mode="outlined"
                placeholder="ชื่อร้านค้า"
                value={ShopName}
                onChangeText={setShopName}
                style={styles.input}
                outlineColor="#E5E7EB"
                activeOutlineColor="#2457C5"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>รายชื่อพนักงาน</Text>
              {employees.map((employee, index) => (
                <View key={index} style={styles.employeeContainer}>
                  <TextInput
                    mode="outlined"
                    placeholder="ชื่อพนักงาน"
                    value={employee}
                    onChangeText={(text) => handleEmployeeChange(text, index)}
                    style={[styles.input, styles.employeeInput]}
                    outlineColor="#E5E7EB"
                    activeOutlineColor="#2457C5"
                  />
                  {employees.length > 1 && (
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeEmployee(index)}
                    >
                      <Text style={styles.removeButtonText}>-</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={addEmployee}>
                <Text style={styles.addButtonText}>+ เพิ่มพนักงาน</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>รหัสผ่านปัจจุบัน</Text>
              <TextInput
                mode="outlined"
                placeholder="รหัสผ่านปัจจุบัน"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                style={styles.input}
                outlineColor="#E5E7EB"
                activeOutlineColor="#2457C5"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>รหัสผ่านใหม่</Text>
              <TextInput
                mode="outlined"
                placeholder="รหัสผ่านใหม่"
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                outlineColor="#E5E7EB"
                activeOutlineColor="#2457C5"
                secureTextEntry
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </Button>
          </View>
        </ScrollView>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#C8EAFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#2457C5',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  employeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  employeeInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#2457C5',
    width: 120,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  removeButton: {
    backgroundColor: '#DC2626',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#2457C5',
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default EditProfile;