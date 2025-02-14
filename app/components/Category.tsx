import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

const CategoryDropdown = ({ 
  selectedValue, 
  onValueChange 
}: { 
  selectedValue: string, 
  onValueChange: (value: string) => void 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const categories =[
    { label: "เลือกประเภทสินค้า", value: "" },
    { label: "เครื่องดื่ม", value: "เครื่องดื่ม" },
    { label: "อาหาร", value: "อาหาร" },
    { label: "ขนมขบเคี้ยว", value: "ขนมขบเคี้ยว" },
    { label: "อาหารแช่แข็ง/อาหารสำเร็จรูป", value: "อาหารแช่แข็ง/อาหารสำเร็จรูป" },
    { label: "ของใช้ในครัวเรือน", value: "ของใช้ในครัวเรือน" },
    { label: "ของใช้ส่วนตัว", value: "ของใช้ส่วนตัว" },
    { label: "เครื่องเขียน/อุปกรณ์สำนักงาน", value: "เครื่องเขียน/อุปกรณ์สำนักงาน" },
    { label: "อุปกรณ์ไฟฟ้า/อิเล็กทรอนิกส์", value: "อุปกรณ์ไฟฟ้า/อิเล็กทรอนิกส์" },
    { label: "เครื่องสำอาง/ความงาม", value: "เครื่องสำอาง/ความงาม" },
    { label: "ยาและอาหารเสริม", value: "ยาและอาหารเสริม" },
    { label: "สินค้าแม่และเด็ก", value: "สินค้าแม่และเด็ก" },
    { label: "อาหารและของใช้สัตว์เลี้ยง", value: "อาหารและของใช้สัตว์เลี้ยง" },
    { label: "อุปกรณ์ทำความสะอาด", value: "อุปกรณ์ทำความสะอาด" },
    { label: "สินค้าตามเทศกาล", value: "สินค้าตามเทศกาล" }
  ];

  const handleSelectCategory = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {categories.find(cat => cat.value === selectedValue)?.label || "เลือกประเภทสินค้า"}
        </Text>
        <View style={styles.dropdownIcon}>
          <Text style={styles.dropdownIconText}>▼</Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>เลือกประเภทสินค้า</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryItem,
                  selectedValue === category.value && styles.selectedCategoryItem
                ]}
                onPress={() => handleSelectCategory(category.value)}
              >
                <Text style={[
                  styles.categoryItemText,
                  selectedValue === category.value && styles.selectedCategoryItemText
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  dropdownIconText: {
    color: '#ddd',
    fontSize: 12,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: width * 0.85,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2457C5',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
    alignItems: 'center',
  },
  selectedCategoryItem: {
    backgroundColor: '#F0F4FF',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#2457C5',
  },
  selectedCategoryItemText: {
    fontWeight: 'bold',
    color: '#2457C5',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CategoryDropdown;