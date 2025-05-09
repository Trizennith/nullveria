import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Unique,
} from 'sequelize-typescript';
import { Users } from './Users';

export interface UserAuthAttributes {
  id?: number;
  userId: number;
  refreshToken: string | null;
  loginData: object | null;
}

@Table({ tableName: 'UserAuth' })
export class UserAuth extends Model<UserAuthAttributes> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  public id!: number;

  @ForeignKey(() => Users)
  @Unique // Ensure that each userId is unique to enforce a one-to-one relationship
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @Column({ type: DataType.STRING, allowNull: true })
  public refreshToken!: string;

  @Column({ type: DataType.JSON })
  public loginData!: object;

  @BelongsTo(() => Users, { as: 'user' })
  public user!: Users;
}
