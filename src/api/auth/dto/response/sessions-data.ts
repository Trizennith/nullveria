import { UserSessionsResultDto } from '../services.dto';

export interface UserSessionsResponseBody {
  status: {
    code: number;
    message: string;
    description?: string;
  };
  data: UserSessionsResultDto;
}
