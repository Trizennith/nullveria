import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Users } from './Users';

export interface UserAddressAttributes {
  id?: number;
  userId: number;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

@Table({ tableName: 'UserAddresses' })
export class UserAddress extends Model<UserAddressAttributes> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  public id!: number;

  @ForeignKey(() => Users)
  @Column({ type: DataType.INTEGER, allowNull: false })
  public userId!: number;

  @Column({ type: DataType.STRING })
  public address1!: string;

  @Column({ type: DataType.STRING })
  public address2!: string;

  @Column({ type: DataType.STRING })
  public city!: string;

  @Column({ type: DataType.STRING })
  public state!: string;

  @Column({ type: DataType.STRING })
  public postalCode!: string;

  @Column({ type: DataType.STRING })
  public country!: string;

  @BelongsTo(() => Users, { as: 'user' })
  public user!: Users;
}
