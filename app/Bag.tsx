import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Header from "./components/Header";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type RootStackParamList = {
  BagScreen: {
    productName: string;
    productPrice: number;
    productCategory: string;
    productBarcode: string;
    productImage: string;
  };
};

type BagScreenRouteProp = RouteProp<RootStackParamList, 'BagScreen'>;

type CartItem = {
  id: string;
  name: string;
  quantity: number;
  image: string;
  price: number;
  category: string;
  barcode: string;
};
const API_BASE_URL = "https://backend-smartcash.vercel.app/";
const BagScreen = () => {
  const route = useRoute<BagScreenRouteProp>();
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // console.log('cartItems:', cartItems);
  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cartItems');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลตะกร้าสินค้าได้');
    }
  };
  const handleClearCart = () => {
    Alert.alert(
      'ยืนยันการล้างตะกร้า',
      'คุณต้องการล้างข้อมูลในตะกร้าทั้งหมดใช่หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ยืนยัน',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('cartItems');
              setCartItems([]);
              Alert.alert('สำเร็จ', 'ล้างข้อมูลในตะกร้าเรียบร้อยแล้ว');
            } catch (error) {
              console.error('Error clearing cart:', error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถล้างข้อมูลในตะกร้าได้');
            }
          },
        },
      ]
    );
  };

  const handleIncrement = async (id: string) => {
    const updatedItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCartItems(updatedItems);
    await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
  };

  const handleDecrement = async (id: string) => {
    const updatedItems = cartItems.map(item =>
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    setCartItems(updatedItems);
    await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
  };


  useEffect(() => {
    if (route.params?.productName && route.params?.productPrice && route.params?.productCategory && route.params?.productBarcode) {
      const newItem: CartItem = {
        id: Date.now().toString(),
        name: route.params.productName,
        price: route.params.productPrice,
        image: route.params.productImage,
        category: route.params.productCategory,
        barcode: route.params.productBarcode,
        quantity: 1
      };

      setCartItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(
          item => item.name === newItem.name && item.price === newItem.price
        );

        if (existingItemIndex >= 0) {
          return prevItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevItems, newItem];
        }
      });
    }
  }, [route.params]);

  useEffect(() => {
    const updateAsyncStorage = async () => {
      await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
    };

    updateAsyncStorage();
  }, [cartItems]);
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // เพิ่มเป็น 30 วินาที
    headers: {
      'Content-Type': 'application/json'
    }
  });
  const saveOrderToMongoDB = async () => {
    try {
      console.log('Starting order save process...');
      
      // สร้างข้อมูล order
      const orderData = {
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
          barcode: item.barcode,
          image: item.image
        })),
        totalAmount: totalPrice
      };
  
      console.log('Sending cart data:', JSON.stringify(orderData, null, 2));
      
      // บันทึก order และอัพเดทจำนวนสินค้าในคราวเดียว
      const response = await api.post('/orders', orderData);
  
      if (response.data.success) {
        console.log('Order saved successfully');
        await AsyncStorage.removeItem('cartItems');
        setCartItems([]);
        Alert.alert('สำเร็จ', 'การชำระเงินเสร็จสมบูรณ์');
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to save order');
      }
    } catch (error) {
      let errorMessage = 'ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง';
  
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
        } else if (!error.response) {
          errorMessage = `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (${error.code}) กรุณาตรวจสอบการเชื่อมต่อ`;
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.error || 'ข้อมูลไม่ถูกต้อง';
        } else if (error.response.status === 500) {
          errorMessage = 'เซิร์ฟเวอร์ผิดพลาด กรุณาลองใหม่ภายหลัง';
        }
      }
  
      Alert.alert(
        'เกิดข้อผิดพลาด',
        `${errorMessage}\n\nรหัสข้อผิดพลาด: ${(error as any).code || 'unknown'}`,
        [
          {
            text: 'ลองใหม่',
            onPress: () => saveOrderToMongoDB()
          },
          {
            text: 'ยกเลิก',
            style: 'cancel'
          }
        ]
      );
      return false;
    }
  };
  
  const handlePayment = async () => {
    if (cartItems.length === 0) {
      Alert.alert('แจ้งเตือน', 'กรุณาเพิ่มสินค้าในตะกร้าก่อนชำระเงิน');
      return;
    }

    Alert.alert(
      'ยืนยันการชำระเงิน',
      `ยอดรวมทั้งสิ้น ${totalPrice} บาท`,
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ชำระเงิน',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await saveOrderToMongoDB();
              // Navigation or additional logic after successful payment
            } catch (error) {
              console.error('Payment process failed:', error);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };



  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>ตะกร้าสินค้า</Text>

        {cartItems.length === 0 ? (
          <Text style={styles.emptyText}>ไม่มีสินค้าในตะกร้า</Text>
        ) : (
          <>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, styles.productColumn]}>ชื่อสินค้า</Text>
                <Text style={[styles.columnHeader, styles.quantityColumn]}>จำนวน</Text>
                <Text style={[styles.columnHeader, styles.priceColumn]}>ราคา/หน่วย</Text>
                <Text style={[styles.columnHeader, styles.totalColumn]}>ราคา(THB)</Text>
              </View>

              {cartItems.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.productColumn]}>{item.name}</Text>
                  <View style={[styles.quantityColumn, styles.quantityControl]}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleDecrement(item.id)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleIncrement(item.id)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.cell, styles.priceColumn]}>{item.price}</Text>
                  <Text style={[styles.cell, styles.totalColumn]}>
                    {item.price * item.quantity}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>ราคารวม</Text>
              <Text style={styles.totalAmount}>{totalPrice}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Text style={styles.clearButtonText}>ล้างตะกร้า</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentButton}
                onPress={handlePayment}
              >
                <Text style={styles.paymentButtonText}>ชำระเงิน</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#747171',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#2457C5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 32,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  columnHeader: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cell: {
    fontSize: 14,
  },
  productColumn: {
    flex: 2,
  },
  quantityColumn: {
    flex: 1.5,
  },
  priceColumn: {
    flex: 1,
    textAlign: 'center',
  },
  totalColumn: {
    flex: 1,
    textAlign: 'right',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2457C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2457C5',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2457C5',
  }
});

export default BagScreen;