import React, { useState, useEffect, createRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ImageSourcePropType,
  RefreshControl,
  Linking,
} from "react-native";
import { Button, Provider as PaperProvider } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import Barcode from "@kichiyaki/react-native-barcode-generator";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { useRoute, RouteProp } from "@react-navigation/native";
import Header from "./components/Header";
import CategoryDropdown from "./components/Category";
import Ionicons from "react-native-vector-icons/Ionicons";
import { RootStackParamList } from "./types";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import ViewShot, { captureRef } from "react-native-view-shot";

interface ListProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  barcode: string;
  quantity: number;
}
interface LotData {
  _id: string;
  lotDate: string;
  cost: number;
  listProduct: ListProduct[];
}

interface Product {
  _id: string;
  lotDate: string;
  cost: number;
  listProduct: ListProduct[];
}
interface Suggestion {
  _id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  barcode: string;
}
const ListProduct = () => {
  const route = useRoute<RouteProp<RootStackParamList, "ListProduct">>();
  const { productId, lotDate } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const viewShotRef = createRef<ViewShot>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [cost, setCost] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [lotData, setLotData] = useState<LotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [productName, setProductName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<ListProduct[]>([]);
  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ListProduct | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBut, setLoadingBut] = useState(false);

  const compressImage = async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // ตรวจสอบไฟล์และขนาด
      const fileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      if (fileInfo.exists) {
        const fileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri, {
          size: true,
        });
        const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

        if (fileSize > 4 * 1024 * 1024) {
          // ถ้าใหญ่เกิน 4MB ให้บีบอัดเพิ่ม
          return await ImageManipulator.manipulateAsync(
            manipulatedImage.uri,
            [{ resize: { width: 600 } }],
            {
              compress: 0.5,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );
        }
      }

      return manipulatedImage;
    } catch (error) {
      console.error("Error compressing image:", error);
      throw error;
    }
  };

  const getSuggestions = (): Suggestion[] => {
    if (!searchQuery || !lotData?.listProduct) return [];

    const searchLower = searchQuery.toLowerCase();
    return lotData.listProduct
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower) ||
          (product.barcode &&
            product.barcode.toLowerCase().includes(searchLower))
      )
      .map((product) => ({
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        image: product.image,
        barcode: product.barcode || "",
      }))
      .slice(0, 5);
  };

  // อัพเดทฟังก์ชัน handleSelectSuggestion
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setFilteredProducts([suggestion]);
  };

  // เพิ่มฟังก์ชันสำหรับการ clear การค้นหา
  const handleClearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setFilteredProducts([]);
  };

  const handleEditClick = (product: ListProduct) => {
    setIsEditing(true);
    setEditingProduct(product);
    setProductName(product.name);
    setCategory(product.category);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setImage(
      product.image
        ? `https://backend-smartcash.vercel.app/images/${product.image}`
        : null
    );
    setModalVisible(true);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().then(() => {
      setRefreshing(false);
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("Fetching products for ID:", productId); // Debug log

      const response = await axios.get(
        `https://backend-smart-cash.vercel.app/products/${productId}`
      );

      console.log("API Response:", response.data); // Debug log

      if (response.data && response.data.success) {
        setLotData(response.data.data);

        const allProductsResponse = await axios.get(
          "https://backend-smart-cash.vercel.app/products"
        );
        setProducts(allProductsResponse.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch products");
      }
    } catch (error: any) {
      console.error("Error fetching products:", error.response || error);
      setError(error.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (productId) {
      fetchProducts();
    }
  }, [productId]);

  const handleFabPress = () => {
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      // เริ่มต้นการโหลด
      setLoadingBut(true);

      if (!productName || !category || !price || !quantity) {
        Alert.alert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
        setLoadingBut(false); // ปิดการโหลดถ้าข้อมูลไม่ครบ
        return;
      }

      const productId = route.params.productId;
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("category", category);
      formData.append("price", price);
      formData.append("quantity", quantity);

      if (image && !image.startsWith("http")) {
        try {
          const compressedImage = await compressImage(image);
          const filename = compressedImage.uri.split("/").pop() || "image.jpg";

          formData.append("image", {
            uri: compressedImage.uri,
            name: filename,
            type: "image/jpeg",
          } as any);
        } catch (error) {
          console.error("Error compressing image:", error);
          Alert.alert(
            "ข้อผิดพลาด",
            "เกิดข้อผิดพลาดในการประมวลผลรูปภาพ กรุณาลองใหม่อีกครั้ง"
          );
          setLoadingBut(false); // ปิดการโหลดเมื่อเกิดข้อผิดพลาด
          return;
        }
      }

      let response;
      if (isEditing && editingProduct) {
        formData.append("productItemId", editingProduct._id);
        response = await axios.put(
          `https://backend-smart-cash.vercel.app/products/${productId}/item`,
          formData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
            timeout: 10000,
          }
        );
      } else {
        response = await axios.post(
          `https://backend-smart-cash.vercel.app/addproducts/${productId}`,
          formData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
            },
            timeout: 10000,
          }
        );
      }

      if (response.data.success) {
        setModalVisible(false);
        resetForm();
        await fetchProducts();
        Alert.alert(
          "สำเร็จ",
          isEditing
            ? "แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว"
            : "บันทึกข้อมูลสินค้าเรียบร้อยแล้ว"
        );
      } else {
        throw new Error(
          response.data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"
        );
      }
    } catch (error) {
      let errorMessage = "เกิดข้อผิดพลาดในการดำเนินการ";
      if (axios.isAxiosError(error)) {
        console.error("Axios Error Response:", error.response);
        errorMessage = error.response?.data?.message || errorMessage;
      }
      Alert.alert("เกิดข้อผิดพลาด", errorMessage);
    } finally {
      // ปิดการโหลดเมื่อเสร็จสิ้นไม่ว่าจะสำเร็จหรือไม่
      setLoadingBut(false);
    }
  };

  // Add a function to reset the form
  const resetForm = () => {
    setProductName("");
    setCategory("");
    setPrice("");
    setQuantity("");
    setImage(null);
    setIsEditing(false);
    setEditingProduct(null);
  };

  const ProductCard = ({ product }: { product: ListProduct }) => {
    const [showBarcode, setShowBarcode] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const viewShotRef = createRef<ViewShot>();

    const generateBarcode = async () => {
      try {
        const response = await axios.patch(
          `https://backend-smart-cash.vercel.app/products/updatebarcode/${productId}`,
          {
            productItemId: product._id,
          }
        );

        if (response.data.success) {
          fetchProducts();
          Alert.alert("สำเร็จ", "สร้างบาร์โค้ดเรียบร้อยแล้ว");
        } else {
          throw new Error(
            response.data.message || "เกิดข้อผิดพลาดในการสร้างบาร์โค้ด"
          );
        }
      } catch (error) {
        console.error("Error generating barcode:", error);
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างบาร์โค้ดได้");
      }
    };
    useEffect(() => {
      (async () => {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "ต้องการสิทธิ์",
            "แอพต้องการสิทธิ์ในการเข้าถึงแกลเลอรี่เพื่อบันทึกบาร์โค้ด"
          );
        }
      })();
    }, []);

    const downloadBarcode = async () => {
      try {
        // ขอสิทธิ์การเข้าถึงแกลเลอรี่
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            "ต้องการสิทธิ์",
            "แอพต้องการสิทธิ์ในการเข้าถึงแกลเลอรี่เพื่อบันทึกบาร์โค้ด"
          );
          return;
        }
    
        if (viewShotRef.current && typeof viewShotRef.current.capture === "function") {
          const uri = await viewShotRef.current.capture();
          
          try {
            // บันทึกไฟล์ไปยัง FileSystem ก่อน
            const filename = `barcode-${product.barcode}.png`;
            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.copyAsync({
              from: uri,
              to: fileUri
            });
    
            // บันทึกลงแกลลอรี่
            const asset = await MediaLibrary.createAssetAsync(fileUri);
            const album = await MediaLibrary.getAlbumAsync('Barcodes');
            
            if (album === null) {
              await MediaLibrary.createAlbumAsync('Barcodes', asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
    
            Alert.alert("สำเร็จ", "บันทึกบาร์โค้ดลงในแกลลอรี่เรียบร้อยแล้ว");
    
            // ลบไฟล์ชั่วคราว
            await FileSystem.deleteAsync(fileUri);
    
          } catch (error) {
            console.error("Error saving barcode:", error);
            Alert.alert(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถบันทึกบาร์โค้ดได้ กรุณาลองใหม่อีกครั้ง"
            );
          }
        }
      } catch (error) {
        console.error("Error capturing barcode:", error);
        Alert.alert(
          "เกิดข้อผิดพลาด",
          "ไม่สามารถสร้างภาพบาร์โค้ดได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    };

    const handleDeleteProduct = async (productItemId: string) => {
      try {
        // แสดง Alert ให้ยืนยันการลบ
        Alert.alert("ยืนยันการลบ", "คุณต้องการลบสินค้านี้ใช่หรือไม่?", [
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
                  `https://backend-smartcash.vercel.app/products/${productId}/item/${productItemId}`
                );

                if (response.data.success) {
                  // Refresh product list
                  await fetchProducts();
                  Alert.alert("สำเร็จ", "ลบสินค้าเรียบร้อยแล้ว");
                } else {
                  throw new Error(
                    response.data.message || "เกิดข้อผิดพลาดในการลบสินค้า"
                  );
                }
              } catch (error) {
                console.error("Error deleting product:", error);
                Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถลบสินค้าได้");
              }
            },
          },
        ]);
      } catch (error) {
        console.error("Error in handleDeleteProduct:", error);
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถดำเนินการลบสินค้าได้");
      }
    };

    return (
      <PaperProvider>
        <View style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Image
                source={{
                  uri: `https://backend-smartcash.vercel.app/images/${product.image}`,
                }}
                style={styles.productImage}
              />
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>
                  ราคา : {product.price} THB
                </Text>
                <Text style={styles.productPrice}>
                  จำนวนชิ้น : {product.quantity}
                </Text>
                <Text style={styles.productCategory}>
                  ประเภท : {product.category}
                </Text>
                <View style={styles.barcodeSection}>
                  <Text style={styles.barcodeLabel}>Barcode : </Text>
                  {!product.barcode ? (
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={generateBarcode}
                    >
                      <Text style={styles.generateButtonText}>สร้าง</Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <ViewShot
                        ref={viewShotRef}
                        options={{
                          format: "jpg",
                          quality: 1,
                        }}
                      >
                        <View style={styles.barcodeContainer}>
                          <Barcode
                            value={product.barcode}
                            format="CODE128"
                            height={80}
                            width={2}
                            maxWidth={300}
                            background="#FFFFFF"
                          />
                          <Text style={styles.barcodeText}>
                            {product.barcode}
                          </Text>
                        </View>
                      </ViewShot>
                      <View style={styles.downloadButtonContainer}>
                        <TouchableOpacity
                          style={styles.downloadButton}
                          onPress={downloadBarcode}
                        >
                          <Text style={styles.downloadButtonText}>บันทึก</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="menu" size={24} color="#2457C5" />
            </TouchableOpacity>
          </View>
          {showMenu && (
            <View style={styles.menuOptions}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleEditClick(product);
                  setShowMenu(false);
                }}
              >
                <Text style={styles.menuText}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleDeleteProduct(product._id);
                  setShowMenu(false);
                }}
              >
                <Text style={styles.menuText}>ลบ</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </PaperProvider>
    );
  };

  const handleCloseModal = () => {
    resetForm();
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>รายการสินค้า</Text>
        {/* ช่องค้นหาพร้อม Autocomplete */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาสินค้า..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(!!text);
              }}
              onFocus={() => setShowSuggestions(!!searchQuery)}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>

          {showSuggestions && getSuggestions().length > 0 && (
            <View style={styles.suggestionsContainer}>
              {getSuggestions().map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  <Ionicons
                    name="search-outline"
                    size={16}
                    color="#666"
                    style={styles.suggestionIcon}
                  />
                  <Text style={styles.suggestionText}>
                    {suggestion.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.datelot}>ล็อตวันที่</Text>
          <Text style={styles.datelotValue}> {lotDate}</Text>
        </View>
        <ScrollView
          style={styles.productList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2457C5"]}
              tintColor="#2457C5"
              title="กำลังโหลด..."
              titleColor="#2457C5"
            />
          }
        >
          {lotData?.listProduct &&
            (searchQuery && filteredProducts.length > 0 ? (

              filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : searchQuery ? (

              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#9e9e9e" />
                <Text style={styles.emptyText}>ไม่พบสินค้าที่ค้นหา</Text>
                <Text style={styles.emptySubText}>ลองค้นหาด้วยคำค้นอื่น</Text>
              </View>
            ) : lotData.listProduct.length > 0 ? (

              lotData.listProduct.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (

              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#9e9e9e" />
                <Text style={styles.emptyText}>ยังไม่มีสินค้าในตอนนี้</Text>
                <Text style={styles.emptySubText}>
                  กดปุ่ม + เพื่อเพิ่มสินค้าใหม่
                </Text>
              </View>
            ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ชื่อสินค้า:</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="ชื่อสินค้า"
              />
            </View>

            <View style={styles.inputGroup}>
              <CategoryDropdown
                selectedValue={category}
                onValueChange={setCategory}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ราคา:</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="ราคา"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>จำนวนสินค้า:</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="จำนวนสินค้า"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>รูปสินค้า:</Text>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.productImage} />
                ) : (
                  <Text style={styles.imageButtonText}>+</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                mode="contained"
                onPress={handleCloseModal}
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
  content: {
    flex: 1,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
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
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  imageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // ทำให้เป็นวงกลม
    borderWidth: 1, // เพิ่มขอบ
    borderColor: "#CCCCCC", // สีขอบเทา
    marginRight: 15,
  },
  imageButtonText: {
    fontSize: 30,
    color: "#2457C5",
  },
  barcodeButton: {
    backgroundColor: "#2457C5",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  barcodeButtonText: {
    color: "white",
    fontSize: 16,
  },
  barcodeContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  barcodeText: {
    marginTop: 8,
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    fontFamily: "monospace", // ใช้ font แบบ monospace เพื่อให้ตัวอักษรมีความกว้างเท่ากัน
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#2457C5",
    padding: 10,
    borderRadius: 5,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#9e9e9e",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: "#9e9e9e",
    marginTop: 8,
  },
  datelot: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2457C5",
    marginTop: 8,
  },
  datelotValue: {
    fontSize: 16,
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flexDirection: "row",
    flex: 1,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: "#00000",
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 16,
    color: "#00000",
    marginBottom: 4,
  },
  barcodeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  barcodeLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  generateButton: {
    backgroundColor: "#2457C5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 14,
  },
  menuButton: {
    padding: 8,
  },
  menuOptions: {
    position: "absolute",
    right: 10,
    top: 40,
    backgroundColor: "#FFF",
    borderRadius: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuText: {
    fontSize: 16,
  },
  productList: {
    marginTop: 20,
  },
  downloadButtonText: {
    color: "#FFF",
    fontSize: 14,
  },
  downloadButtonContainer: {
    alignItems: "stretch",
    paddingTop: 5,
    width: "20%",
  },
  downloadButton: {
    backgroundColor: "#2457C5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 12,
    height: 40,
  },
  searchWrapper: {
    position: "relative",
    zIndex: 1,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionIcon: {
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default ListProduct;
