export interface UserType {
  _id: string;
  name: string;
  email: string;
}

export type SigninResponse = {
  user: UserType;
  accessToken: string;
  refreshToken: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type VerifyOtpResponse = {
  message: string;
};

export type ResetPasswordResponse = {
  message: string;
};
