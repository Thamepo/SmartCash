import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/th';

const API_URL = 'https://backend-smartcash.vercel.app/';

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  category: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  page: number;
  totalOrders: number;
}

const History = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async (pageNum: number, shouldRefresh: boolean = false) => {
    if (loading || (!hasMore && !shouldRefresh)) return;

    try {
      setLoading(true);
      const fullUrl = `${API_URL}orders?page=${pageNum}&limit=10`;
      
      const response = await axios.get<OrdersResponse>(fullUrl);
      const newOrders = response.data.data;
      
      if (shouldRefresh) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }
      
      setHasMore(newOrders.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert(
        'เกิดข้อผิดพลาด',
        'ไม่สามารถโหลดประวัติการขายได้'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    fetchOrders(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchOrders(page + 1);
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const orderDate = moment(item.orderDate).locale('th').format('D MMMM YYYY, HH:mm น.');
  
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderDate}>{orderDate}</Text>
          <Text style={styles.orderTotal}>
            {item.totalAmount.toLocaleString()} THB
          </Text>
        </View>
        <FlatList
          data={item.items}
          keyExtractor={(product, index) => `${item._id}-${index}`}
          renderItem={({ item: product }) => (
            <View style={styles.productItem}>
              <Text style={styles.productName}>{product.productName}</Text>
              <View style={styles.productDetails}>
                <Text>{product.quantity} x {product.price.toLocaleString()} THB</Text>
                <Text style={styles.productSubtotal}>
                  {(product.quantity * product.price).toLocaleString()} THB
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || isRefreshing) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2457C5" />
      </View>
    );
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
        <View style={styles.content}>
          <Text style={styles.title}>ประวัติการขาย</Text>
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            renderItem={renderOrderItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>ไม่มีประวัติการขาย</Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#2457C5"]}
                tintColor="#2457C5"
                title="กำลังโหลด..."
                titleColor="#2457C5"
              />
            }
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  backText: {
    color: '#2457C5',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2457C5',
  },
  productItem: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  productSubtotal: {
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default History;