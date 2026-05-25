import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  ClaimStatus,
  DocumentOwnerType,
  DocumentStatus,
  PaymentMethod,
  PaymentStatus,
  PolicyStatus,
  Prisma,
  ProductStatus,
  QuotationStatus,
  UserRole,
  UserStatus,
  PrismaClient,
} from '@prisma/client';

const prisma = new PrismaClient();
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const SALT_ROUNDS = 12;

const now = new Date('2026-05-24T09:00:00.000Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
const monthsAgo = (months: number) => {
  const date = new Date(now);
  date.setMonth(date.getMonth() - months);
  return date;
};

const makeDecimal = (value: number) => new Prisma.Decimal(value);

const escapePdfText = (value: string) => value.replace(/[\\()]/g, '\\$&');

const buildPdfBuffer = (title: string, lines: string[]) => {
  const stream = [
    'BT',
    '/F1 24 Tf',
    '72 760 Td',
    `(${escapePdfText(title)}) Tj`,
    '/F1 14 Tf',
    ...lines.flatMap((line, index) => [
      index === 0 ? '0 -36 Td' : '0 -22 Td',
      `(${escapePdfText(line)}) Tj`,
    ]),
    'ET',
  ].join('\n');

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += object;
  }

  const xrefStart = Buffer.byteLength(body, 'utf8');
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    `${xrefStart}`,
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(body + xref, 'utf8');
};

const placeholderPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6XfH8AAAAASUVORK5CYII=';

const writeFileIfMissing = async (fileName: string, buffer: Buffer) => {
  await fs.mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

const hash = async (password: string) => bcrypt.hash(password, SALT_ROUNDS);

async function main() {
  await fs.mkdir(uploadsDir, { recursive: true });

  await prisma.document.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.insuranceProduct.deleteMany();

  await Promise.all([
    writeFileIfMissing('seed-policy-certificate.pdf', buildPdfBuffer('Policy Certificate', [
      'Insurance Platform Seed',
      'Policy Certificate Placeholder',
      'For customer verification and download testing.',
    ])),
    writeFileIfMissing('seed-payment-proof.png', Buffer.from(placeholderPngBase64, 'base64')),
    writeFileIfMissing('seed-claim-photo.png', Buffer.from(placeholderPngBase64, 'base64')),
    writeFileIfMissing('seed-customer-id.png', Buffer.from(placeholderPngBase64, 'base64')),
  ]);

  const passwordHash = await hash('Admin@12345!');
  const customerPasswordHash = await hash('Customer@12345!');

  const staff = await prisma.$transaction(async (tx) => {
    const created = await Promise.all([
      tx.user.create({
        data: {
          fullName: 'Aklile Tesfaye',
          email: 'superadmin@insure.et',
          phone: '+251911110000',
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(1),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Mekdes Hailu',
          email: 'admin@insure.et',
          phone: '+251911110001',
          passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(2),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Saron Kassa',
          email: 'finance@insure.et',
          phone: '+251911110002',
          passwordHash,
          role: UserRole.FINANCE_OFFICER,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(1),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Amanuel Bekele',
          email: 'claims@insure.et',
          phone: '+251911110003',
          passwordHash,
          role: UserRole.CLAIM_OFFICER,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(1),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Nardos Tadesse',
          email: 'manager@insure.et',
          phone: '+251911110004',
          passwordHash,
          role: UserRole.MANAGER,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(3),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Tigist Wolde',
          email: 'assessor@insure.et',
          phone: '+251911110005',
          passwordHash,
          role: UserRole.ASSESSOR,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(5),
        },
      }),
      tx.user.create({
        data: {
          fullName: 'Dawit Negash',
          email: 'agent@insure.et',
          phone: '+251911110006',
          passwordHash,
          role: UserRole.AGENT,
          status: UserStatus.ACTIVE,
          lastLoginAt: daysAgo(4),
        },
      }),
    ]);

    return created;
  });

  const customers = await prisma.$transaction(async (tx) => {
    const user1 = await tx.user.create({
      data: {
        fullName: 'Ablaze Tadesse',
        email: 'ablaze@example.com',
        phone: '+251911111111',
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: daysAgo(1),
        customerProfile: {
          create: {
            nationalId: 'ETH-000112233',
            address: 'Bole, Addis Ababa',
            dateOfBirth: new Date('1991-08-13T00:00:00.000Z'),
          },
        },
      },
      include: { customerProfile: true },
    });
    const user2 = await tx.user.create({
      data: {
        fullName: 'Saron Kassa',
        email: 'saron@example.com',
        phone: '+251922222222',
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: daysAgo(2),
        customerProfile: {
          create: {
            nationalId: 'ETH-000112244',
            address: 'Megenagna, Addis Ababa',
            dateOfBirth: new Date('1995-02-24T00:00:00.000Z'),
          },
        },
      },
      include: { customerProfile: true },
    });
    const user3 = await tx.user.create({
      data: {
        fullName: 'Aman Tesfaye',
        email: 'aman@example.com',
        phone: '+251933333333',
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: daysAgo(3),
        customerProfile: {
          create: {
            nationalId: 'ETH-000112255',
            address: 'CMC, Addis Ababa',
            dateOfBirth: new Date('1988-10-02T00:00:00.000Z'),
          },
        },
      },
      include: { customerProfile: true },
    });
    const user4 = await tx.user.create({
      data: {
        fullName: 'Mekdes Hailu',
        email: 'mekdes@example.com',
        phone: '+251944444444',
        passwordHash: customerPasswordHash,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: daysAgo(5),
        customerProfile: {
          create: {
            nationalId: 'ETH-000112266',
            address: 'Bahir Dar, Amhara',
            dateOfBirth: new Date('1993-05-17T00:00:00.000Z'),
          },
        },
      },
      include: { customerProfile: true },
    });

    return [user1, user2, user3, user4];
  });

  const products = await prisma.$transaction(async (tx) => {
    const create = (data: Parameters<typeof tx.insuranceProduct.create>[0]['data']) =>
      tx.insuranceProduct.create({ data });

    return Promise.all([
      create({
        name: 'Motor Comprehensive Insurance',
        code: 'MOTOR-COMP',
        category: 'Motor',
        description: 'Comprehensive motor cover for private and commercial vehicles.',
        status: ProductStatus.ACTIVE,
        basePremium: makeDecimal(12000),
        premiumRate: makeDecimal(3),
        coverageDescription: 'Covers accident, theft, fire, third-party liability, and damage.',
        requiredDocuments: ['Vehicle registration', 'Driving license', 'National ID'],
        termsAndConditions: 'Subject to inspection, underwriting approval, and policy schedule terms.',
      }),
      create({
        name: 'Health Plus Insurance',
        code: 'HEALTH-PLUS',
        category: 'Health',
        description: 'Outpatient and inpatient medical insurance for families and individuals.',
        status: ProductStatus.ACTIVE,
        basePremium: makeDecimal(8500),
        premiumRate: makeDecimal(2),
        coverageDescription: 'Covers hospital bills, consultation, medication, and emergency care.',
        requiredDocuments: ['National ID', 'Birth certificate', 'Medical declaration'],
        termsAndConditions: 'Pre-existing conditions and waiting periods apply.',
      }),
      create({
        name: 'Family Life Cover',
        code: 'LIFE-FAMILY',
        category: 'Life',
        description: 'Flexible life insurance protection with optional riders.',
        status: ProductStatus.ACTIVE,
        basePremium: makeDecimal(15000),
        premiumRate: makeDecimal(1.2),
        coverageDescription: 'Provides lump-sum benefits for death and terminal illness.',
        requiredDocuments: ['National ID', 'Beneficiary details'],
        termsAndConditions: 'Coverage subject to age, underwriting, and exclusions listed in policy schedule.',
      }),
      create({
        name: 'Property Shield',
        code: 'PROPERTY-SHIELD',
        category: 'Property',
        description: 'Protects residential and business property from common risks.',
        status: ProductStatus.ACTIVE,
        basePremium: makeDecimal(9800),
        premiumRate: makeDecimal(2.5),
        coverageDescription: 'Covers fire, burglary, storm damage, and accidental damage.',
        requiredDocuments: ['National ID', 'Property ownership document', 'Photos of property'],
        termsAndConditions: 'Inspection may be required before policy issuance.',
      }),
      create({
        name: 'Travel Guard',
        code: 'TRAVEL-GUARD',
        category: 'Travel',
        description: 'Short-term travel protection for trips within and outside Ethiopia.',
        status: ProductStatus.ACTIVE,
        basePremium: makeDecimal(3200),
        premiumRate: makeDecimal(1.8),
        coverageDescription: 'Covers travel delay, baggage loss, and emergency medical expenses.',
        requiredDocuments: ['National ID', 'Travel itinerary', 'Passport copy'],
        termsAndConditions: 'Coverage applies only during the insured travel period.',
      }),
    ]);
  });

  const [motorProduct, healthProduct, lifeProduct, propertyProduct, travelProduct] = products;
  const [customer1, customer2, customer3, customer4] = customers;

  const quotations = await prisma.$transaction(async (tx) => {
    const createQuote = async (params: {
      number: string;
      customerId: string;
      productId: string;
      status: QuotationStatus;
      coverage: number;
      calculated: number;
      finalPremium: number;
      customerInput?: Prisma.InputJsonValue;
      adminNote?: string | null;
      validUntil?: Date | null;
    }) =>
      tx.quotation.create({
        data: {
          quotationNumber: params.number,
          customerId: params.customerId,
          productId: params.productId,
          status: params.status,
          requestedCoverageAmount: makeDecimal(params.coverage),
          calculatedPremium: makeDecimal(params.calculated),
          finalPremium: makeDecimal(params.finalPremium),
          customerInput: params.customerInput ?? undefined,
          adminNote: params.adminNote ?? undefined,
          validUntil: params.validUntil ?? null,
        },
      });

    return Promise.all([
      createQuote({
        number: 'QUO-2026-000001',
        customerId: customer1.id,
        productId: motorProduct.id,
        status: QuotationStatus.APPROVED,
        coverage: 500000,
        calculated: 15000,
        finalPremium: 16000,
        customerInput: {
          vehicleType: 'Sedan',
          plateNumber: 'ET-3A-12345',
          vehicleMake: 'Toyota',
          vehicleModel: 'Corolla',
          manufactureYear: 2021,
          vehicleValue: 650000,
          usageType: 'Private',
        },
        adminNote: 'Approved after inspection and documents review.',
        validUntil: daysFromNow(30),
      }),
      createQuote({
        number: 'QUO-2026-000002',
        customerId: customer2.id,
        productId: healthProduct.id,
        status: QuotationStatus.SUBMITTED,
        coverage: 250000,
        calculated: 5000,
        finalPremium: 5000,
        customerInput: {
          dependentCount: 3,
        },
        validUntil: daysFromNow(21),
      }),
      createQuote({
        number: 'QUO-2026-000003',
        customerId: customer3.id,
        productId: lifeProduct.id,
        status: QuotationStatus.REJECTED,
        coverage: 1000000,
        calculated: 12000,
        finalPremium: 12000,
        adminNote: 'Income evidence and beneficiary details were incomplete.',
        validUntil: daysAgo(3),
      }),
      createQuote({
        number: 'QUO-2026-000004',
        customerId: customer4.id,
        productId: propertyProduct.id,
        status: QuotationStatus.EXPIRED,
        coverage: 750000,
        calculated: 24000,
        finalPremium: 24000,
        validUntil: daysAgo(1),
      }),
      createQuote({
        number: 'QUO-2026-000005',
        customerId: customer1.id,
        productId: travelProduct.id,
        status: QuotationStatus.DRAFT,
        coverage: 150000,
        calculated: 3200,
        finalPremium: 3200,
        validUntil: daysFromNow(7),
      }),
    ]);
  });

  const [quote1, quote2, quote3, quote4, quote5] = quotations;

  const policies = await prisma.$transaction(async (tx) => {
    const createPolicy = async (params: {
      number: string;
      customerId: string;
      productId: string;
      quotationId: string;
      status: PolicyStatus;
      coverage: number;
      premium: number;
      startDate: Date;
      endDate: Date;
      policyData?: Prisma.InputJsonValue;
    }) =>
      tx.policy.create({
        data: {
          policyNumber: params.number,
          customerId: params.customerId,
          productId: params.productId,
          quotationId: params.quotationId,
          status: params.status,
          coverageAmount: makeDecimal(params.coverage),
          premiumAmount: makeDecimal(params.premium),
          startDate: params.startDate,
          endDate: params.endDate,
          policyData: params.policyData ?? undefined,
        },
      });

    return Promise.all([
      createPolicy({
        number: 'POL-2026-000001',
        customerId: customer1.id,
        productId: motorProduct.id,
        quotationId: quote1.id,
        status: PolicyStatus.ACTIVE,
        coverage: 500000,
        premium: 16000,
        startDate: monthsAgo(1),
        endDate: daysFromNow(335),
        policyData: { vehicleType: 'Sedan', plateNumber: 'ET-3A-12345', vehicleValue: 650000 },
      }),
      createPolicy({
        number: 'POL-2026-000002',
        customerId: customer2.id,
        productId: healthProduct.id,
        quotationId: quote2.id,
        status: PolicyStatus.PENDING_PAYMENT,
        coverage: 250000,
        premium: 5000,
        startDate: now,
        endDate: daysFromNow(365),
        policyData: { dependents: 3 },
      }),
      createPolicy({
        number: 'POL-2026-000003',
        customerId: customer3.id,
        productId: lifeProduct.id,
        quotationId: quote3.id,
        status: PolicyStatus.EXPIRED,
        coverage: 1000000,
        premium: 12000,
        startDate: monthsAgo(14),
        endDate: daysAgo(10),
        policyData: { beneficiary: 'Family' },
      }),
      createPolicy({
        number: 'POL-2026-000004',
        customerId: customer4.id,
        productId: propertyProduct.id,
        quotationId: quote4.id,
        status: PolicyStatus.SUSPENDED,
        coverage: 750000,
        premium: 24000,
        startDate: monthsAgo(3),
        endDate: daysFromNow(80),
        policyData: { propertyType: 'Residential' },
      }),
    ]);
  });

  const [policy1, policy2, policy3, policy4] = policies;

  const payments = await prisma.$transaction(async (tx) => {
    const createPayment = async (params: {
      reference: string;
      customerId: string;
      policyId: string;
      amount: number;
      method: PaymentMethod;
      status: PaymentStatus;
      proofUrl?: string | null;
      transactionReference?: string | null;
      financeNote?: string | null;
      paidAt?: Date | null;
      verifiedAt?: Date | null;
    }) =>
      tx.payment.create({
        data: {
          paymentReference: params.reference,
          customerId: params.customerId,
          policyId: params.policyId,
          amount: makeDecimal(params.amount),
          method: params.method,
          status: params.status,
          proofUrl: params.proofUrl ?? undefined,
          transactionReference: params.transactionReference ?? undefined,
          financeNote: params.financeNote ?? undefined,
          paidAt: params.paidAt ?? undefined,
          verifiedAt: params.verifiedAt ?? undefined,
        },
      });

    return Promise.all([
      createPayment({
        reference: 'PAY-2026-000001',
        customerId: customer1.id,
        policyId: policy1.id,
        amount: 16000,
        method: PaymentMethod.TELEBIRR,
        status: PaymentStatus.VERIFIED,
        proofUrl: '/uploads/seed-payment-proof.png',
        transactionReference: 'TB-66001',
        financeNote: 'Payment verified from proof and transaction reference.',
        paidAt: daysAgo(4),
        verifiedAt: daysAgo(3),
      }),
      createPayment({
        reference: 'PAY-2026-000002',
        customerId: customer2.id,
        policyId: policy2.id,
        amount: 5000,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        proofUrl: '/uploads/seed-payment-proof.png',
        transactionReference: 'BT-88002',
        paidAt: daysAgo(1),
      }),
      createPayment({
        reference: 'PAY-2026-000003',
        customerId: customer3.id,
        policyId: policy3.id,
        amount: 12000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.REJECTED,
        financeNote: 'Receipt could not be validated.',
        paidAt: daysAgo(8),
      }),
      createPayment({
        reference: 'PAY-2026-000004',
        customerId: customer4.id,
        policyId: policy4.id,
        amount: 24000,
        method: PaymentMethod.CHAPA,
        status: PaymentStatus.REFUNDED,
        financeNote: 'Refund completed after duplicate submission.',
        paidAt: daysAgo(12),
        verifiedAt: daysAgo(11),
      }),
    ]);
  });

  const [payment1, payment2, payment3, payment4] = payments;

  const claims = await prisma.$transaction(async (tx) => {
    const createClaim = async (params: {
      number: string;
      customerId: string;
      policyId: string;
      claimType: string;
      incidentDate: Date;
      incidentLocation: string;
      description: string;
      estimatedAmount: number;
      approvedAmount?: number | null;
      status: ClaimStatus;
      rejectionReason?: string | null;
      adminNote?: string | null;
    }) =>
      tx.claim.create({
        data: {
          claimNumber: params.number,
          customerId: params.customerId,
          policyId: params.policyId,
          claimType: params.claimType,
          incidentDate: params.incidentDate,
          incidentLocation: params.incidentLocation,
          description: params.description,
          estimatedAmount: makeDecimal(params.estimatedAmount),
          ...(params.approvedAmount !== undefined && params.approvedAmount !== null
            ? { approvedAmount: makeDecimal(params.approvedAmount) }
            : {}),
          status: params.status,
          rejectionReason: params.rejectionReason ?? undefined,
          adminNote: params.adminNote ?? undefined,
        },
      });

    return Promise.all([
      createClaim({
        number: 'CLM-2026-000001',
        customerId: customer1.id,
        policyId: policy1.id,
        claimType: 'Motor accident',
        incidentDate: daysAgo(12),
        incidentLocation: 'Bole, Addis Ababa',
        description: 'Rear-end collision with bumper damage and headlight cracks.',
        estimatedAmount: 85000,
        status: ClaimStatus.DOCUMENT_REVIEW,
        adminNote: 'Awaiting police report and inspection photos.',
      }),
      createClaim({
        number: 'CLM-2026-000002',
        customerId: customer1.id,
        policyId: policy1.id,
        claimType: 'Theft',
        incidentDate: daysAgo(25),
        incidentLocation: 'Kazanchis, Addis Ababa',
        description: 'Vehicle accessories stolen from parked car.',
        estimatedAmount: 42000,
        approvedAmount: 30000,
        status: ClaimStatus.APPROVED,
        adminNote: 'Approved for partial settlement.',
      }),
      createClaim({
        number: 'CLM-2026-000003',
        customerId: customer2.id,
        policyId: policy2.id,
        claimType: 'Medical',
        incidentDate: daysAgo(18),
        incidentLocation: 'St. Paul Hospital',
        description: 'Hospital admission for emergency treatment.',
        estimatedAmount: 36000,
        status: ClaimStatus.REJECTED,
        rejectionReason: 'Policy waiting period was not completed.',
        adminNote: 'Rejected after waiting period check.',
      }),
      createClaim({
        number: 'CLM-2026-000004',
        customerId: customer4.id,
        policyId: policy4.id,
        claimType: 'Fire damage',
        incidentDate: daysAgo(7),
        incidentLocation: 'Bahir Dar',
        description: 'Property wall and roof affected by small electrical fire.',
        estimatedAmount: 145000,
        approvedAmount: 130000,
        status: ClaimStatus.SETTLED,
        adminNote: 'Final payout completed and case closed.',
      }),
    ]);
  });

  const [claim1, claim2, claim3, claim4] = claims;

  await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.CUSTOMER,
          ownerId: customer1.id,
          uploadedByUserId: customer1.id,
          documentType: 'National ID',
          originalFileName: 'ablaze-id.png',
          storedFileName: 'seed-customer-id.png',
          mimeType: 'image/png',
          size: 2048,
          fileUrl: '/uploads/seed-customer-id.png',
          status: DocumentStatus.APPROVED,
          reviewNote: 'Identity verified.',
        },
      }),
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.POLICY,
          ownerId: policy1.id,
          uploadedByUserId: staff[1].id,
          documentType: 'Policy Certificate',
          originalFileName: 'motor-certificate.pdf',
          storedFileName: 'seed-policy-certificate.pdf',
          mimeType: 'application/pdf',
          size: 4096,
          fileUrl: '/uploads/seed-policy-certificate.pdf',
          status: DocumentStatus.APPROVED,
          reviewNote: 'Certificate issued after payment verification.',
        },
      }),
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.PAYMENT,
          ownerId: payment1.id,
          uploadedByUserId: customer1.id,
          documentType: 'Payment Proof',
          originalFileName: 'telebirr-proof.png',
          storedFileName: 'seed-payment-proof.png',
          mimeType: 'image/png',
          size: 2048,
          fileUrl: '/uploads/seed-payment-proof.png',
          status: DocumentStatus.APPROVED,
          reviewNote: 'Proof accepted.',
        },
      }),
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.CLAIM,
          ownerId: claim1.id,
          uploadedByUserId: customer1.id,
          documentType: 'Accident Photo',
          originalFileName: 'claim-photo.png',
          storedFileName: 'seed-claim-photo.png',
          mimeType: 'image/png',
          size: 2048,
          fileUrl: '/uploads/seed-claim-photo.png',
          status: DocumentStatus.PENDING_REVIEW,
        },
      }),
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.CLAIM,
          ownerId: claim1.id,
          uploadedByUserId: staff[3].id,
          documentType: 'Police Report',
          originalFileName: 'police-report.pdf',
          storedFileName: 'seed-policy-certificate.pdf',
          mimeType: 'application/pdf',
          size: 4096,
          fileUrl: '/uploads/seed-policy-certificate.pdf',
          status: DocumentStatus.PENDING_REVIEW,
        },
      }),
      tx.document.create({
        data: {
          ownerType: DocumentOwnerType.CUSTOMER,
          ownerId: customer2.customerProfile?.id ?? customer2.id,
          uploadedByUserId: customer2.id,
          documentType: 'Profile Verification',
          originalFileName: 'customer-profile.png',
          storedFileName: 'seed-customer-id.png',
          mimeType: 'image/png',
          size: 2048,
          fileUrl: '/uploads/seed-customer-id.png',
          status: DocumentStatus.PENDING_REVIEW,
        },
      }),
    ]);
  });

  console.log('Seed completed successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
