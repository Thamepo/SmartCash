import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Alert, 
  Dimensions, 
  TouchableOpacity,
  Animated,
  Pressable,
  Platform 
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { RootStackParamList } from './types';

type ProductData = {
  name: string;
  category: string;
  price: number;
  image: string;
  barcode: string;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const API_BASE_URL = "https://backend-smartcash.vercel.app/"

const ScanScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Start scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 150,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      setIsProcessing(false);
    };
  }, []);

  const fetchProductData = async (barcode: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/barcode/${barcode}`, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (response.data.success) {
        setScannedProduct(response.data.data);
      } else {
        Alert.alert('ไม่พบสินค้า', 'ไม่พบข้อมูลสินค้าในระบบ');
      }
    } catch (error) {
      let errorMessage = 'ไม่สามารถดึงข้อมูลสินค้าได้';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง';
        } else if (!error.response) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
        } else if (error.response.status === 404) {
          errorMessage = 'ไม่พบสินค้าในระบบ';
        }
      }
      
      Alert.alert('เกิดข้อผิดพลาด', errorMessage);
      console.error('Error fetching product:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isProcessing) return;
    setLastScannedBarcode(data);
  };

  const handleCapture = async () => {
    if (isProcessing) return;
    if (!lastScannedBarcode) {
      Alert.alert('แจ้งเตือน', 'กรุณาสแกนบาร์โค้ดอีกครั้ง');
      return;
    }
    setIsProcessing(true);
    await fetchProductData(lastScannedBarcode);
  };

  const saveProductToStorage = async (product: ProductData) => {
    try {
      // Get existing cart items
      const existingCartJson = await AsyncStorage.getItem('cartItems');
      let cartItems = existingCartJson ? JSON.parse(existingCartJson) : [];
      
      // Add new product with quantity 1
      const newItem = {
        ...product,
        id: Date.now().toString(),
        quantity: 1
      };
      
      // Check if product already exists
      const existingItemIndex = cartItems.findIndex(
        (item: ProductData & { id: string }) => item.barcode === product.barcode
      );
      
      if (existingItemIndex >= 0) {
        // Increment quantity if product exists
        cartItems[existingItemIndex].quantity += 1;
      } else {
        // Add new product if it doesn't exist
        cartItems.push(newItem);
      }
      
      // Save updated cart back to storage
      await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving to AsyncStorage:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกสินค้าลงในตะกร้าได้');
    }
  };

  const handleAddToCart = async () => {
    if (scannedProduct) {
      await saveProductToStorage(scannedProduct);
      navigation.navigate('BagScreen', {
        productName: scannedProduct.name,
        productPrice: scannedProduct.price,
        productCategory: scannedProduct.category,
        productBarcode: scannedProduct.barcode,
        productImage: scannedProduct.image,
      });
    }
  };
  

  const handleCancel = () => {
    setScannedProduct(null);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>กำลังขออนุญาตใช้งานกล้อง...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>ไม่ได้รับอนุญาตให้ใช้งานกล้อง</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["code128", "qr", "ean13", "ean8"]
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      
      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.unfocused} />
        <View style={styles.middleRow}>
          <View style={styles.unfocused} />
          <View style={styles.focused}>
            <Animated.View 
              style={[
                styles.scanLine,
                {
                  transform: [{
                    translateY: scanLineAnim
                  }]
                }
              ]}
            />
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.unfocused} />
        </View>
        <View style={styles.unfocused} />
      </View>

      {/* Capture Button */}
      {!scannedProduct && (
        <View style={styles.captureButtonContainer}>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet */}
      {scannedProduct && (
        <View style={styles.bottomSheet}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>ชื่อสินค้า: {scannedProduct.name}</Text>
            <Text style={styles.productCategory}>หมวดหมู่: {scannedProduct.category}</Text>
            <Text style={styles.productPrice}>ราคา: {scannedProduct.price} THB</Text>
          </View>
          <View style={styles.buttonRow}>
            <Pressable 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>ยกเลิก</Text>
            </Pressable>
            <Pressable 
              style={styles.confirmButton}
              onPress={handleAddToCart}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                เพิ่มลงตะกร้า
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
  },
  unfocused: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 150,
  },
  focused: {
    width: 300,
    height: 150,
    position: 'relative',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#2457C5',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#2457C5',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2457C5',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  productInfo: {
    marginBottom: 20,
  },
  productName: {
    fontSize: 16,
    color: '#2457C5',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    color: '#747171',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    color: '#FFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2457C5',
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
  },
  confirmText: {
    color: 'white',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ScanScreen;