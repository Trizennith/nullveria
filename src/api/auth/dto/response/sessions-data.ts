import { StandardReponseData } from 'src/common/utils/base-types';
import { UserSessionsResultDto } from '../services.dto';

export type UserSessionsResponseBody = {
  data: UserSessionsResultDto;
} & StandardReponseData;
