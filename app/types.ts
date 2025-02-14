export type RootStackParamList = {
  Login: undefined;
  Home: { 
    email: string; 
    _id: string; 
  };
  Scan: undefined;
  Product: undefined;
  ListProduct: {
    productId: string;
    lotDate: string;
  };
  ScanScreen: undefined; 
  BagScreen: {
    productName: string;
    productPrice: number;
    productCategory: string;
    productBarcode: string;
    productImage: string;
  }; 
  ProductMain: undefined;
  Header: undefined;
  EditProfile: undefined;
  History: undefined;
};
