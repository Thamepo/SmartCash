import React, { useState } from "react";
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Alert } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Menu } from 'react-native-paper';
import { useNavigation, StackActions } from '@react-navigation/native';
import { RootStackParamList } from "../types";
import { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from '@react-native-async-storage/async-storage';

type HeaderNavigation = StackNavigationProp<RootStackParamList, "Header">;
const Header = () => {
  const [visible, setVisible] = useState(false);
    const navigation = useNavigation<HeaderNavigation>();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleEditProfile = () => {
    closeMenu();
    navigation.navigate('EditProfile');
  };

  const handleHistory = () => {
    closeMenu();
    navigation.navigate('History');
  };

  const handleLogout = async () => {
    try {
      // ลบข้อมูลทั้งหมดที่เกี่ยวข้องกับการล็อกอิน
      await AsyncStorage.multiRemove(['userId', 'email', 'isLoggedIn']);
      closeMenu();
      navigation.dispatch(StackActions.popToTop());
    } catch (error) {
      console.log('Logout Error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
    }
  };

  return (
    <SafeAreaView style={styles.headerContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SMART CASH</Text>
        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity onPress={openMenu}>
              <Ionicons name="person-outline" size={24} color="#2457C5" />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            onPress={handleEditProfile}
            title="แก้ไขข้อมูลผู้ใช้"
            leadingIcon="account-edit"
            titleStyle={styles.EditprofileText}
          />
          <Menu.Item
            onPress={handleHistory}
            title="ประวัติการขาย"
            leadingIcon="history"
            titleStyle={styles.EditprofileText}
          />
          <Menu.Item
            onPress={handleLogout}
            title="ออกจากระบบ"
            leadingIcon="logout"
            titleStyle={styles.logoutText}
          />
        </Menu>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#C8EAFF',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#C8EAFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2457C5',
  },
  menuContent: {
    backgroundColor: 'white',
    marginTop: 30, // ปรับระยะห่างของเมนูจากไอคอน
  },
  logoutText: {
    color: '#ef4444', // สีแดงสำหรับปุ่มออกจากระบบ
  },
  EditprofileText: {
    color: '#393c42', // สีน้ำเงินสำหรับปุ่มแก้ไขข้อมูลผู้ใช้
  },
});

export default Header;