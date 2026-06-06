import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// CRITICAL error handler required by Firebase Integration guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Interfaces representing DB documents
export interface UserProfileDoc {
  suiAddress: string;
  spendingBalance: number;
  flexibleBalance: number;
  accumulatedYieldSui: number;
  spendAndSaveEnabled: boolean;
  spendAndSavePercentage: number;
  routingRatioPolicy: string;
  emailAlertsEnabled: boolean;
  userEmailAddress: string;
}

export interface AllocationRuleDoc {
  id: string;
  name: string;
  destination: string;
  percentage: number;
  isActive: boolean;
  targetGoalId?: string;
}

export interface TargetSavingsPlanDoc {
  id: string;
  name: string;
  targetAmountSui: number;
  currentAmountSui: number;
  maturityDate: string;
  createdAt: string;
  isUnlocked: boolean;
}

export interface FixedDepositPlanDoc {
  id: string;
  amountSui: number;
  durationDays: number;
  apy: number;
  startDate: string;
  maturityDate: string;
  isWithdrawn: boolean;
}

export interface HistoricalTransactionDoc {
  id: string;
  txHash: string;
  type: string;
  amountSui: number;
  timestamp: string;
  description: string;
  ptbCommandCount: number;
  ptbSteps: string[];
  status: string;
}

// ---------------- USER PROFILE OPERATION ----------------
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfileDoc;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(uid: string, profile: UserProfileDoc): Promise<void> {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- ALLOCATION RULES OPERATIONS ----------------
export async function getAllocationRules(uid: string): Promise<AllocationRuleDoc[]> {
  const path = `users/${uid}/rules`;
  try {
    const ref = collection(db, 'users', uid, 'rules');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as AllocationRuleDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveAllocationRule(uid: string, rule: AllocationRuleDoc): Promise<void> {
  const path = `users/${uid}/rules/${rule.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'rules', rule.id), rule);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAllocationRule(uid: string, ruleId: string): Promise<void> {
  const path = `users/${uid}/rules/${ruleId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'rules', ruleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- TARGET SAVINGS PLANS OPERATIONS ----------------
export async function getTargetSavingsPlans(uid: string): Promise<TargetSavingsPlanDoc[]> {
  const path = `users/${uid}/targetPlans`;
  try {
    const ref = collection(db, 'users', uid, 'targetPlans');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as TargetSavingsPlanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTargetSavingsPlan(uid: string, plan: TargetSavingsPlanDoc): Promise<void> {
  const path = `users/${uid}/targetPlans/${plan.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'targetPlans', plan.id), plan);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTargetSavingsPlan(uid: string, planId: string): Promise<void> {
  const path = `users/${uid}/targetPlans/${planId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'targetPlans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- FIXED DEPOSITS OPERATIONS ----------------
export async function getFixedDepositPlans(uid: string): Promise<FixedDepositPlanDoc[]> {
  const path = `users/${uid}/fixedDeposits`;
  try {
    const ref = collection(db, 'users', uid, 'fixedDeposits');
    const snap = await getDocs(ref);
    return snap.docs.map(d => d.data() as FixedDepositPlanDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveFixedDepositPlan(uid: string, deposit: FixedDepositPlanDoc): Promise<void> {
  const path = `users/${uid}/fixedDeposits/${deposit.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'fixedDeposits', deposit.id), deposit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFixedDepositPlan(uid: string, depositId: string): Promise<void> {
  const path = `users/${uid}/fixedDeposits/${depositId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'fixedDeposits', depositId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- HISTORICAL TRANSACTIONS OPERATIONS ----------------
export async function getHistoricalTransactions(uid: string): Promise<HistoricalTransactionDoc[]> {
  const path = `users/${uid}/transactions`;
  try {
    const ref = collection(db, 'users', uid, 'transactions');
    // We query and sort transactions by timestamp descending
    const q = query(ref, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q).catch(() => getDocs(ref)); // Fallback if no index set up yet
    return snap.docs.map(d => d.data() as HistoricalTransactionDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveHistoricalTransaction(uid: string, transaction: HistoricalTransactionDoc): Promise<void> {
  const path = `users/${uid}/transactions/${transaction.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'transactions', transaction.id), transaction);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
