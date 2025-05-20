import { StandardReponseData } from 'src/common/utils/base-types';

export type SessionData = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponseDto = {
  data: {
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: 'user' | 'admin' | 'super_admin';
    isActive?: boolean;
    isVerified?: boolean;
    sessionData: SessionData;
  };
} & StandardReponseData;

export type LoginSessionResponse = {
  status: {
    code: number;
    message: string;
    description?: string;
  };
  accessToken: string;
  refreshToken: string;
};
