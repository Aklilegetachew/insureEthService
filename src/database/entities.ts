import { randomUUID } from 'node:crypto';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import {
  ClaimStatus,
  DocumentOwnerType,
  DocumentStatus,
  PaymentMethod,
  PaymentStatus,
  PolicyStatus,
  ProductStatus,
  QuotationStatus,
  UserRole,
  UserStatus,
} from './enums.js';

@Entity({ name: 'User' })
export class User {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column()
  fullName!: string;

  @Index()
  @Column({ unique: true })
  email!: string;

  @Index()
  @Column({ unique: true })
  phone!: string;

  @Column()
  passwordHash!: string;

  @Index()
  @Column({ type: 'enum', enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @Index()
  @Column({ type: 'enum', enum: UserStatus, enumName: 'UserStatus', default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => CustomerProfile, (profile) => profile.user)
  customerProfile?: CustomerProfile | null;

  @OneToMany(() => Quotation, (quotation) => quotation.customer)
  quotations!: Quotation[];

  @OneToMany(() => Policy, (policy) => policy.customer)
  policies!: Policy[];

  @OneToMany(() => Payment, (payment) => payment.customer)
  payments!: Payment[];

  @OneToMany(() => Claim, (claim) => claim.customer)
  claims!: Claim[];

  @OneToMany(() => Document, (document) => document.uploadedBy)
  documents!: Document[];
}

@Entity({ name: 'CustomerProfile' })
export class CustomerProfile {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index({ unique: true })
  @Column({ unique: true })
  userId!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  nationalId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  address!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dateOfBirth!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.customerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}

@Entity({ name: 'Document' })
@Index(['ownerType', 'ownerId'])
export class Document {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column({ type: 'enum', enum: DocumentOwnerType, enumName: 'DocumentOwnerType' })
  ownerType!: DocumentOwnerType;

  @Column()
  ownerId!: string;

  @Index()
  @Column()
  uploadedByUserId!: string;

  @Column()
  documentType!: string;

  @Column()
  originalFileName!: string;

  @Column()
  storedFileName!: string;

  @Column()
  mimeType!: string;

  @Column()
  size!: number;

  @Column()
  fileUrl!: string;

  @Index()
  @Column({ type: 'enum', enum: DocumentStatus, enumName: 'DocumentStatus', default: DocumentStatus.PENDING_REVIEW })
  status!: DocumentStatus;

  @Column({ type: 'varchar', nullable: true })
  reviewNote!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy!: User;
}

@Entity({ name: 'InsuranceProduct' })
export class InsuranceProduct {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Column()
  name!: string;

  @Index()
  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Index()
  @Column()
  category!: string;

  @Index()
  @Column({ type: 'enum', enum: ProductStatus, enumName: 'ProductStatus', default: ProductStatus.ACTIVE })
  status!: ProductStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  basePremium!: string | null;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  premiumRate!: string | null;

  @Column({ type: 'varchar', nullable: true })
  coverageDescription!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  requiredDocuments!: unknown;

  @Column({ type: 'varchar', nullable: true })
  termsAndConditions!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Quotation, (quotation) => quotation.product)
  quotations!: Quotation[];

  @OneToMany(() => Policy, (policy) => policy.product)
  policies!: Policy[];
}

@Entity({ name: 'Quotation' })
export class Quotation {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index()
  @Column({ unique: true })
  quotationNumber!: string;

  @Index()
  @Column()
  customerId!: string;

  @Index()
  @Column()
  productId!: string;

  @Index()
  @Column({ type: 'enum', enum: QuotationStatus, enumName: 'QuotationStatus', default: QuotationStatus.SUBMITTED })
  status!: QuotationStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  requestedCoverageAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  calculatedPremium!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalPremium!: string;

  @Column({ type: 'jsonb', nullable: true })
  customerInput!: unknown;

  @Column({ type: 'varchar', nullable: true })
  adminNote!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  validUntil!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.quotations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => InsuranceProduct, (product) => product.quotations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: InsuranceProduct;

  @OneToOne(() => Policy, (policy) => policy.quotation)
  policy?: Policy | null;
}

@Entity({ name: 'Policy' })
export class Policy {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index()
  @Column({ unique: true })
  policyNumber!: string;

  @Index()
  @Column()
  customerId!: string;

  @Index()
  @Column()
  productId!: string;

  @Column({ unique: true })
  quotationId!: string;

  @Index()
  @Column({ type: 'enum', enum: PolicyStatus, enumName: 'PolicyStatus', default: PolicyStatus.PENDING_PAYMENT })
  status!: PolicyStatus;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  coverageAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  premiumAmount!: string;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ type: 'jsonb', nullable: true })
  policyData!: unknown;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.policies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => InsuranceProduct, (product) => product.policies, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: InsuranceProduct;

  @OneToOne(() => Quotation, (quotation) => quotation.policy, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quotationId' })
  quotation!: Quotation;

  @OneToMany(() => Payment, (payment) => payment.policy)
  payments!: Payment[];

  @OneToMany(() => Claim, (claim) => claim.policy)
  claims!: Claim[];
}

@Entity({ name: 'Claim' })
export class Claim {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index()
  @Column({ unique: true })
  claimNumber!: string;

  @Index()
  @Column()
  customerId!: string;

  @Index()
  @Column()
  policyId!: string;

  @Column()
  claimType!: string;

  @Column({ type: 'timestamp' })
  incidentDate!: Date;

  @Column()
  incidentLocation!: string;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  estimatedAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  approvedAmount!: string | null;

  @Index()
  @Column({ type: 'enum', enum: ClaimStatus, enumName: 'ClaimStatus', default: ClaimStatus.SUBMITTED })
  status!: ClaimStatus;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason!: string | null;

  @Column({ type: 'varchar', nullable: true })
  adminNote!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => Policy, (policy) => policy.claims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy!: Policy;
}

@Entity({ name: 'Payment' })
export class Payment {
  @PrimaryColumn('uuid')
  id: string = randomUUID();

  @Index()
  @Column({ unique: true })
  paymentReference!: string;

  @Index()
  @Column()
  customerId!: string;

  @Index()
  @Column()
  policyId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: PaymentMethod, enumName: 'PaymentMethod' })
  method!: PaymentMethod;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, enumName: 'PaymentStatus', default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  proofUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  transactionReference!: string | null;

  @Column({ type: 'varchar', nullable: true })
  financeNote!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @ManyToOne(() => Policy, (policy) => policy.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy!: Policy;
}
