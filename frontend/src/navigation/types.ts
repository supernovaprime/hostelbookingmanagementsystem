export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  SuperAdminPortal: undefined;
  ManagerPortal: undefined;
  TenantPortal: undefined;
  Messages: undefined;
  ComposeMessage: undefined;
  MessageDetail: { conversationId: string };
  RoomSelection: { hostelId: string; checkInDate: Date; checkOutDate: Date; numberOfGuests: number };
  Payment: { bookingData: any };
};
