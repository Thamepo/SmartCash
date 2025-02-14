// Product.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import axios, { AxiosError } from "axios";
import { Button, Provider as PaperProvider } from "react-native-paper";
import Header from "./components/Header";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type ListProductNavigation = StackNavigationProp<RootStackParamList, "Product">;

interface ListProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  barcode: string;
}

interface Product {
  _id: string;
  lotDate: string;
  cost: number;
  listProduct: ListProduct[];
  updatedAt: string;
  __v: number;
}

const Product = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigation = useNavigation<ListProductNavigation>();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBut, setLoadingBut] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().then(() => {
      setRefreshing(false);
    });
  }, []);

  const calculateTotals = (listProduct: ListProduct[]) => {
    return {
      totalQuantity: listProduct.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: listProduct.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    };
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://backend-smartcash.vercel.app/products"
      );
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to fetch products");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDate(new Date(product.lotDate));
    setCost(product.cost.toString());
    setModalVisible(true);
    setActiveMenu(null);
  };

  const handleSubmit = async () => {
    try {
      setLoadingBut(true); // เริ่มโหลด

      // ตรวจสอบการกรอกข้อมูล
      if (!cost || !date) {
        Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
        setLoadingBut(false);
        return;
      }

      if (editingProduct) {
        // แก้ไขล็อตสินค้า
        const response = await axios.put(
          `https://backend-smartcash.vercel.app/products/${editingProduct._id}`,
          {
            lotDate: date,
            cost: Number(cost),
          }
        );

        if (response.data.success) {
          Alert.alert("สำเร็จ", "แก้ไขล็อตสินค้าเรียบร้อยแล้ว");
          setEditingProduct(null);
        }
      } else {
        // เพิ่มล็อตสินค้าใหม่
        const response = await axios.post(
          "https://backend-smartcash.vercel.app/products",
          {
            lotDate: date,
            cost: Number(cost),
          }
        );

        if (response.status === 201) {
          Alert.alert("สำเร็จ", "เพิ่มล็อตสินค้าเรียบร้อยแล้ว");
        }
      }

      // รีเซ็ตค่าและปิด Modal
      setModalVisible(false);
      setCost("");
      setDate(new Date());
      // ดึงข้อมูลใหม่
      await fetchProducts();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoadingBut(false); // สิ้นสุดการโหลดไม่ว่าจะสำเร็จหรือไม่
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleMenu = (productId: string) => {
    setActiveMenu(activeMenu === productId ? null : productId);
  };

  const handleProductPress = (productId: string, lotDate: string) => {
    navigation.navigate("ListProduct", {
      productId,
      lotDate: new Date(lotDate).toLocaleDateString("th-TH"),
    });
  };

  const handleDelete = (productId: string) => {
    Alert.alert("ยืนยันการลบ", "คุณต้องการลบล็อตสินค้านี้ใช่หรือไม่?", [
      {
        text: "ยกเลิก",
        style: "cancel",
      },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await axios.delete(
              `https://backend-smartcash.vercel.app/products/${productId}`
            );

            if (response.data.success) {
              Alert.alert("สำเร็จ", "ลบล็อตสินค้าเรียบร้อยแล้ว");
              setActiveMenu(null);
              await fetchProducts(); // รีเฟรชข้อมูล
            }
          } catch (error) {
            console.error("Error deleting product:", error);
            Alert.alert("Error", "Failed to delete product");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>ล็อตสินค้า</Text>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2457C5"]} // สีของ loading indicator
              tintColor="#2457C5" // สำหรับ iOS
              title="กำลังโหลด..." // ข้อความที่แสดงขณะรีเฟรช (iOS)
              titleColor="#2457C5" // สีข้อความ (iOS)
            />
          }
        >
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color="#9e9e9e" />
              <Text style={styles.emptyText}>ยังไม่มีล็อตสินค้าในตอนนี้</Text>
              <Text style={styles.emptySubText}>
                กดปุ่ม + เพื่อเพิ่มล็อตสินค้าใหม่
              </Text>
            </View>
          ) : (
            <View style={styles.sumbox}>
              {products.map((product) => {
                const { totalQuantity, totalPrice } = calculateTotals(
                  product.listProduct
                );
                return (
                  <View key={product._id} style={styles.productCard}>
                    <TouchableOpacity
                      onPress={() =>
                        handleProductPress(product._id, product.lotDate)
                      }
                    >
                      <View style={styles.productHeader}>
                        <View style={styles.productInfo}>
                          <View>
                            <Text style={styles.dateText}>
                              ล็อตวันที่:{" "}
                              {new Date(product.lotDate).toLocaleDateString(
                                "th-TH"
                              )}
                            </Text>
                            <Text style={styles.costText}>
                              ต้นทุน: {product.cost.toLocaleString()} THB
                            </Text>
                            <Text style={styles.costText}>
                              จำนวนชิ้น: {totalQuantity.toLocaleString()}
                            </Text>
                            <Text style={styles.costText}>
                              ราคาขาย: {totalPrice.toLocaleString()} THB
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={() => toggleMenu(product._id)}
                        >
                          <Ionicons name="menu" size={24} color="#2457C5" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                    {activeMenu === product._id && (
                      <View style={styles.menuOptions}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => handleEdit(product)}
                        >
                          <Text style={styles.menuText}>แก้ไข</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.menuItem, styles.deleteMenuItem]}
                          onPress={() => handleDelete(product._id)}
                        >
                          <Text style={styles.deleteMenuText}>ลบ</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingProduct(null);
          setDate(new Date());
          setCost("");
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? "แก้ไขล็อต" : "เพิ่มล็อต"}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ล็อตวันที่:</Text>
              <View style={styles.dateInputContainer}>
                <TextInput
                  style={styles.dateInput}
                  value={date.toLocaleDateString("th-TH")}
                  editable={false}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={24} color="#2457C5" />
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ต้นทุน:</Text>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                placeholder="ต้นทุน"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={() => {
                  setModalVisible(false);
                  setEditingProduct(null);
                  setCost("");
                  setDate(new Date());
                }}
                style={styles.cancelButton}
                labelStyle={styles.buttonText}
              >
                ยกเลิก
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.confirmButton}
                labelStyle={styles.buttonText}
                loading={loadingBut}
                disabled={loadingBut}
              >
                {loadingBut ? "กำลังบันทึก..." : "ตกลง"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00796B",
    fontFamily: "THSarabunNew",
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  deleteMenuText: {
    color: "#FF3B30",
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  menuButton: {
    padding: 8,
    zIndex: 3, // เพิ่ม zIndex
  },
  menuOptions: {
    position: "absolute",
    right: 10,
    top: 40,
    backgroundColor: "#FFF",
    borderRadius: 4,
    elevation: 8, // เพิ่ม elevation สำหรับ Android
    zIndex: 1000, // เพิ่ม zIndex สำหรับ iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuText: {
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
  },
  productCard: {
    width: "100%",
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    borderColor: "rgba(80, 129, 234, 0.22)",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24.8,
    elevation: 5,
    position: "relative",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
  },
  box: {
    width: "100%",
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    borderColor: "rgba(80, 129, 234, 0.22)",
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 24.8,
    elevation: 5,
    position: "relative", // เพิ่ม position relative
  },
  sumbox: {
    marginTop: 20,
  },
  fab: {
    position: "absolute",
    right: 30,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2457C5",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#2457C5",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  dateInput: {
    flex: 1,
    padding: 10,
  },
  productContent: {
    padding: 15,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2457C5",
  },
  costText: {
    fontSize: 16,
    color: "#00000",
  },
  boxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    position: "relative", // เพิ่ม position relative
    zIndex: 2, // เพิ่ม zIndex
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9e9e9e",
    marginTop: 16,
    fontFamily: "THSarabunNew",
  },
  emptySubText: {
    fontSize: 16,
    color: "#9e9e9e",
    marginTop: 8,
    fontFamily: "THSarabunNew",
  },
});

export default Product;
