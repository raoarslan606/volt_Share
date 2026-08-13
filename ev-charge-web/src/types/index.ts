export type Role = 'DRIVER' | 'HOST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isVerified: boolean;
  cnicImageUrl?: string;
  cnicNumber?: string;
  authProvider: 'LOCAL' | 'GOOGLE';
  createdAt: string;
}

export interface Station {
  id: string;
  hostId: string;
  hostName?: string;
  hostPhone?: string;
  stationType: 'HOUSEHOLD' | 'PUBLIC';
  stationName: string;
  latitude: number;
  longitude: number;
  address: string;
  capacity: string;
  connectorType: string;
  pricePerKwh: number;
  photos: string[];
  isAvailable: boolean;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  subscriptionExpiry?: string;
  distance?: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  driverId: string;
  stationId: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  unitsCharged?: number;
  totalAmount?: number;
  createdAt: string;
  station?: {
    stationName: string;
    address: string;
    photos?: string[];
  };
  driver?: {
    name: string;
    phone: string;
  };
}

export interface Subscription {
  id: string;
  hostId: string;
  amount: number;
  transactionId: string;
  screenshotUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  validTill?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  stationId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
  };
}
