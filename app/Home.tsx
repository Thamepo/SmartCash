// Home.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BarChart } from "react-native-chart-kit";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";
import { RootStackParamList } from "./types";
import { useRoute, RouteProp } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { List, Menu, Divider, Button } from "react-native-paper";
import { PaperProvider } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import "moment/locale/th";
import Scan from "./ScanScreen";
import ProductScreen from "./Product";
import EditProfle from "./EditProfile";
import ListProduct from "./ListProduct";
import Bag from "./Bag";
import Header from "./components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createBottomTabNavigator<RootStackParamList>();
const ProductStack = createStackNavigator<RootStackParamList>();
const BagStack = createStackNavigator<RootStackParamList>();
// Type definitions
interface Product {
  name: string;
  sales: number;
  amount: number;
  cost: number;
  category: string;
}
interface DashboardData {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  dailySales: { [key: number]: number };
  topProducts: any[];
  orderCount: number;
}
interface CategoryData {
  [key: string]: Product[];
}
interface DropdownProps {
  label: string;
  value: string;
  items: Array<{ id: string; name: string }>;
  onSelect: (value: string) => void;
}
interface Category {
  id: string;
  name: string;
}

interface CalendarPickerProps {
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
}

// ข้อมูลตัวอย่าง
const categories: Category[] = [
  { id: "all", name: "ทั้งหมด" },
  { id: "เครื่องดื่ม", name: "เครื่องดื่ม" },
  { id: "อาหาร", name: "อาหาร" },
  { id: "ขนมขบเคี้ยว", name: "ขนมขบเคี้ยว" },
  { id: "อาหารแช่แข็ง/อาหารสำเร็จรูป", name: "อาหารแช่แข็ง/อาหารสำเร็จรูป" },
  { id: "ของใช้ในครัวเรือน", name: "ของใช้ในครัวเรือน" },
  { id: "ของใช้ส่วนตัว", name: "ของใช้ส่วนตัว" },
  { id: "เครื่องเขียน/อุปกรณ์สำนักงาน", name: "เครื่องเขียน/อุปกรณ์สำนักงาน" },
  { id: "อุปกรณ์ไฟฟ้า/อิเล็กทรอนิกส์", name: "อุปกรณ์ไฟฟ้า/อิเล็กทรอนิกส์" },
  { id: "เครื่องสำอาง/ความงาม", name: "เครื่องสำอาง/ความงาม" },
  { id: "ยาและอาหารเสริม", name: "ยาและอาหารเสริม" },
  { id: "สินค้าแม่และเด็ก", name: "สินค้าแม่และเด็ก" },
  { id: "อาหารและของใช้สัตว์เลี้ยง", name: "อาหารและของใช้สัตว์เลี้ยง" },
  { id: "อุปกรณ์ทำความสะอาด", name: "อุปกรณ์ทำความสะอาด" },
  { id: "สินค้าตามเทศกาล", name: "สินค้าตามเทศกาล" },
];

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  onSelectDate,
  selectedDate,
}) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    onSelectDate(date);
    hideDatePicker();
  };

  // แปลงวันที่เป็นข้อความภาษาไทย
  const formatThaiDate = (date: Date) => {
    moment.locale("th");
    return moment(date).format("D MMMM YYYY");
  };

  return (
    <View>
      <TouchableOpacity
        onPress={showDatePicker}
        style={styles.datePickerButton}
      >
        <Text style={styles.dateText}>{formatThaiDate(selectedDate)}</Text>
      </TouchableOpacity>

      {isDatePickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            hideDatePicker();
            if (date) {
              handleConfirm(date);
            }
          }}
        />
      )}
    </View>
  );
};

const CustomDropdown: React.FC<DropdownProps> = ({
  label,
  value,
  items,
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const selectedItem = items.find((item) => item.id === value);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setVisible(true)}
          style={styles.dropdownButton}
          icon="chevron-down"
        >
          {selectedItem?.name || label}
        </Button>
      }
    >
      {items.map((item) => (
        <Menu.Item
          key={item.id}
          onPress={() => {
            onSelect(item.id);
            setVisible(false);
          }}
          title={item.name}
        />
      ))}
    </Menu>
  );
};

const HomeScreen = () => {
  const screenWidth = Dimensions.get("window").width;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData().then(() => {
      setRefreshing(false);
    });
  }, []);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(36, 87, 197, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
  };

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [chartCategory, setChartCategory] = useState("all"); // สำหรับกราฟ
  const [rankingCategory, setRankingCategory] = useState("all"); // สำหรับอันดับ
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    dailySales: {}, // เริ่มเป็นออบเจ็กต์เปล่า
    topProducts: [],
    orderCount: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);
  // useEffect(() => {
  //   const checkUserId = async () => {
  //     const userId = await AsyncStorage.getItem('userId');
  //     console.log('Current userId:', userId);
  //   };
  //   checkUserId();
  // }, []);
  const fetchDashboardData = async () => {
    try {
      const month = selectedDate.getMonth();
      const year = selectedDate.getFullYear();
      const response = await fetch(
        `https://backend-smartcash.vercel.app/dashboard/${month}-${year}`
      );
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันกรองข้อมูลสำหรับกราฟ
  const getFilteredChartData = () => {
    if (chartCategory === "all") {
      return dashboardData.topProducts;
    }
    return dashboardData.topProducts.filter(
      (product: any) =>
        product.category ===
        categories.find((cat) => cat.id === chartCategory)?.name
    );
  };

  // ฟังก์ชันกรองข้อมูลสำหรับอันดับ
  const getFilteredRankingData = () => {
    if (rankingCategory === "all") {
      return dashboardData.topProducts;
    }
    return dashboardData.topProducts.filter(
      (product: any) =>
        product.category ===
        categories.find((cat) => cat.id === rankingCategory)?.name
    );
  };

  const chartData = {
    labels: getFilteredChartData().map((product: any) => product.name),
    datasets: [
      {
        data: getFilteredChartData().map((product: any) => product.revenue),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Header />
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
        <View style={styles.header}>
          <Text style={styles.title}>รายงานยอดขาย</Text>
          <CalendarPicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.card, styles.salesCard]}>
            <View style={styles.salesSection}>
              <Text style={styles.cardLabel}>ยอดขายวันนี้</Text>
              <Text style={styles.cardValue}>
                {(
                  dashboardData?.dailySales?.[selectedDate.getDate()] ?? 0
                ).toLocaleString()}{" "}
                THB
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.salesSection}>
              <Text style={styles.cardLabel}>ยอดขายรวมทั้งเดือน</Text>
              <Text style={styles.cardValue}>
                {(dashboardData?.totalSales ?? 0).toLocaleString()} THB
              </Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>กำไร/ขาดทุน</Text>
            <Text
              style={[
                styles.cardValue,
                {
                  color:
                    (dashboardData?.totalProfit ?? 0) >= 0
                      ? "#22c55e"
                      : "#ef4444",
                },
              ]}
            >
              {(dashboardData?.totalProfit ?? 0) >= 0 ? "+" : ""}
              {(dashboardData?.totalProfit ?? 0).toLocaleString()} THB
            </Text>
          </View>
        </View>

        {/* Additional Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardLabel}>ต้นทุนรวม</Text>
          <Text style={styles.cardValue}>
            {dashboardData.totalCost.toLocaleString()} THB
          </Text>
          <Text style={styles.cardLabel}>จำนวนออเดอร์</Text>
          <Text style={styles.cardValue}>
            {dashboardData.orderCount} รายการ
          </Text>
        </View>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>กราฟแสดงยอดขายสินค้า</Text>
            <CustomDropdown
              label="เลือกหมวดหมู่"
              value={chartCategory}
              items={categories}
              onSelect={setChartCategory}
            />
          </View>
          <BarChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" THB"
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
          />
        </View>

        {/* Top Products Ranking */}
        <View style={styles.rankingContainer}>
          <View style={styles.rankingHeader}>
            <View style={styles.rankingTitleContainer}>
              <Text style={styles.sectionTitle}>อันดับสินค้าขายดี</Text>
              <CustomDropdown
                label="เลือกหมวดหมู่"
                value={rankingCategory}
                items={categories}
                onSelect={setRankingCategory}
              />
            </View>
          </View>
          {getFilteredRankingData().map((product: any, index: number) => (
            <View key={index} style={styles.rankingItem}>
              <View style={styles.rankNumber}>
                <Text style={styles.rankNumberText}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCategory}>
                  หมวดหมู่: {product.category}
                </Text>
              </View>
              <View style={styles.productStats}>
                <Text style={styles.salesNumber}>
                  {product.quantitySold} ชิ้น
                </Text>
                <Text style={styles.salesAmount}>
                  {product.revenue.toLocaleString()} THB
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const BagStackScreen = () => (
  <PaperProvider>
    <BagStack.Navigator>
      <BagStack.Screen
        name="Scan"
        component={Scan}
        options={{
          headerShown: false,
        }}
      />
      <BagStack.Screen
        name="BagScreen"
        component={Bag}
        options={{
          headerShown: false,
        }}
      />
    </BagStack.Navigator>
  </PaperProvider>
);

const ProductStackScreen = () => (
  <PaperProvider>
    <ProductStack.Navigator>
      <ProductStack.Screen
        name="ProductMain"
        component={ProductScreen}
        options={{ headerShown: false }}
      />
      <ProductStack.Screen
        name="ListProduct"
        component={ListProduct}
        options={{ headerShown: false }}
      />
    </ProductStack.Navigator>
  </PaperProvider>
);

const Home = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Home">>();

  return (
    <PaperProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#C8EAFF",
            height: 60,
            borderTopWidth: 0,
            position: "relative",
          },
          tabBarItemStyle: {
            marginTop: 10,
          },
          tabBarIcon: ({ focused, color }) => {
            let iconName = "";
            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "ScanScreen") {
              iconName = focused ? "qr-code" : "qr-code-outline";
            } else if (route.name === "Product") {
              iconName = focused ? "archive" : "archive-outline";
            }
            //    else if (route.name === "Bag") {
            //   iconName = focused ? "cart" : "cart-outline";
            // }

            if (route.name === "ScanScreen") {
              return (
                <View style={styles.scanButton}>
                  <Ionicons name={iconName} size={30} color="#FFFFFF" />
                </View>
              );
            }

            return <Ionicons name={iconName} size={30} color={color} />;
          },
          tabBarActiveTintColor: "#2457C5",
          tabBarInactiveTintColor: "#8E8E93",
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          initialParams={route.params}
        />
        <Tab.Screen name="ScanScreen" component={BagStackScreen} />
        <Tab.Screen name="Product" component={ProductStackScreen} />
      </Tab.Navigator>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00796B",
    marginBottom: 30,
    fontFamily: "THSarabunNew",
  },
  scanButton: {
    backgroundColor: "#2457C5",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownButton: {
    backgroundColor: "white",
    borderColor: "#C0C0C0",
    borderRadius: 8,
    width: 130,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    width: 160,
  },
  picker: {
    height: 40,
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  rankingContainer: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  rankNumber: {
    width: 40,
    alignItems: "center",
  },
  rankNumberText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b7280",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productCategory: {
    fontSize: 14,
    color: "#6b7280",
  },
  productStats: {
    alignItems: "flex-end",
  },
  salesNumber: {
    fontSize: 16,
    fontWeight: "500",
  },
  salesAmount: {
    fontSize: 14,
    color: "#6b7280",
  },
  datePickerButton: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C0C0C0",
    minWidth: 160,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  statsCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingRight: 16,
  },
  salesCard: {
    flex: 1,
    paddingVertical: 12,
  },
  salesSection: {
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
});

export default Home;
