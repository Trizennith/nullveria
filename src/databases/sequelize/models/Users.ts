import { Model, Table, Column, DataType, HasOne } from 'sequelize-typescript';
import { UserAddress } from './UserAddress';

export interface UserAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
}

@Table({ tableName: 'Users' })
export class Users extends Model<UserAttributes> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  public id!: number;

  @Column({ type: DataType.STRING })
  public firstName!: string;

  @Column({ type: DataType.STRING })
  public lastName!: string;

  @Column({ type: DataType.STRING })
  public fullName!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  public email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  public password!: string;

  @HasOne(() => UserAddress, { as: 'address' })
  public address!: UserAddress;
}
