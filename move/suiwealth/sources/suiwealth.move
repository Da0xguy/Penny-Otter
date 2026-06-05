/*
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

module suiwealth::suiwealth {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::event;

    // --- Error CONSTANTS ---
    const EInsufficientFunds: u64 = 100;
    const ELockerStillRestricted: u64 = 101;
    const EGoalAlreadyCompleted: u64 = 102;
    const EInvalidDuration: u64 = 103;
    const EInvalidParameter: u64 = 104;

    // --- Structures & Capabilities ---

    /// Admin Capability to change reward configurations and manage base protocol APYs
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Global Shared State to track total locked SUI and protocol performance metrics
    public struct SharedProtocolVault has key {
        id: UID,
        total_flexible_balance: Balance<SUI>,
        accumulated_flexible_interest: u64,
        total_active_lock_contracts: u64,
        base_flexible_apy_bps: u64, // Basis points (e.g., 485 for 4.85% APY)
    }

    /// Individual Fixed term deposit Locker owned directly by the depositors
    public struct FixedLocker has key, store {
        id: UID,
        owner: address,
        principal: Balance<SUI>,
        start_timestamp_ms: u64,
        duration_ms: u64,
        apy_bps: u64, // e.g., 625 (6.25%), 850 (8.50%), 1200 (12.00%)
        is_active: bool,
    }

    /// Goal-Oriented savings target object owned directly by the user
    public struct SavingsGoal has key, store {
        id: UID,
        title: vector<u8>,
        target_amount_sui: u64,
        balance: Balance<SUI>,
        is_completed: bool,
    }

    // --- Event Declarations for Indexing ---

    public struct DepositFlexibleEvent has copy, drop {
        sender: address,
        amount: u64,
    }

    public struct WithdrawFlexibleEvent has copy, drop {
        sender: address,
        amount: u64,
    }

    public struct LockerCreatedEvent has copy, drop {
        locker_id: ID,
        depositor: address,
        amount: u64,
        duration_ms: u64,
        apy_bps: u64,
    }

    public struct LockerClaimedEvent has copy, drop {
        locker_id: ID,
        recipient: address,
        principal_returned: u64,
        interest_earned: u64,
        is_early_termination: bool,
        penalty_deducted: u64,
    }

    public struct GoalCreatedEvent has copy, drop {
        goal_id: ID,
        title: vector<u8>,
        target_amount: u64,
    }

    public struct GoalFundedEvent has copy, drop {
        goal_id: ID,
        amount: u64,
        is_now_complete: bool,
    }

    // --- Initialization ---

    fun init(ctx: &mut TxContext) {
        // Deploy and transfer Admin capability to package deployer
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));

        // Share the default configuration Protocol state
        let shared_vault = SharedProtocolVault {
            id: object::new(ctx),
            total_flexible_balance: balance::zero(),
            accumulated_flexible_interest: 0,
            total_active_lock_contracts: 0,
            base_flexible_apy_bps: 485, // 4.85% APY
        };
        transfer::share_object(shared_vault);
    }

    // --- Public Entry: Flexible Savings Stream (oWealth) ---

    /// Deposit funds into the flexible interest-bearing stream vault
    public entry fun deposit_flexible(
        vault: &mut SharedProtocolVault,
        deposit_coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&deposit_coin);
        assert!(amount > 0, EInsufficientFunds);

        let coin_balance = coin::into_balance(deposit_coin);
        balance::join(&mut vault.total_flexible_balance, coin_balance);

        event::emit(DepositFlexibleEvent {
            sender,
            amount,
        });
    }

    /// Withdraw funds instantly from the flexible interest stream mapping
    public entry fun withdraw_flexible(
        vault: &mut SharedProtocolVault,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let vault_value = balance::value(&vault.total_flexible_balance);
        assert!(vault_value >= amount, EInsufficientFunds);

        let withdraw_balance = balance::split(&mut vault.total_flexible_balance, amount);
        let payout_coin = coin::from_balance(withdraw_balance, ctx);

        transfer::public_transfer(payout_coin, sender);

        event::emit(WithdrawFlexibleEvent {
            sender,
            amount,
        });
    }

    // --- Public Entry: Fixed Locker Tenure system ---

    /// Create and transfer ownership of a Fixed Term locker to the user
    public entry fun create_fixed_locker(
        vault: &mut SharedProtocolVault,
        deposit_coin: Coin<SUI>,
        duration_ms: u64,
        apy_bps: u64,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let amount = coin::value(&deposit_coin);
        assert!(amount > 0, EInsufficientFunds);
        // Minimum standards durations
        assert!(duration_ms > 0, EInvalidDuration);

        let start_timestamp_ms = clock::timestamp_ms(clock_obj);
        let uid = object::new(ctx);
        let locker_id = object::uid_to_inner(&uid);

        let locker = FixedLocker {
            id: uid,
            owner: sender,
            principal: coin::into_balance(deposit_coin),
            start_timestamp_ms,
            duration_ms,
            apy_bps,
            is_active: true,
        };

        vault.total_active_lock_contracts = vault.total_active_lock_contracts + 1;
        transfer::public_transfer(locker, sender);

        event::emit(LockerCreatedEvent {
            locker_id,
            depositor: sender,
            amount,
            duration_ms,
            apy_bps,
        });
    }

    /// Claim or Terminate a fixed locker.
    /// If closed before maturity (curr_time < maturity), a 25% early withdrawal penalty on the principal is charged.
    public entry fun claim_fixed_locker(
        vault: &mut SharedProtocolVault,
        mut locker: FixedLocker,
        clock_obj: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(locker.owner == sender, EInsufficientFunds);
        assert!(locker.is_active, EInsufficientFunds);

        let curr_time = clock::timestamp_ms(clock_obj);
        let maturity_time = locker.start_timestamp_ms + locker.duration_ms;
        let is_early_termination = curr_time < maturity_time;

        let principal_val = balance::value(&locker.principal);
        let mut final_balance = balance::zero();

        let mut penalty_deducted = 0;
        let mut interest_earned = 0;

        if (is_early_termination) {
            // Apply 25% premature exit penalty to the principal SUI balance
            penalty_deducted = (principal_val * 25) / 100;
            let net_payout = principal_val - penalty_deducted;

            // Direct penalty into shared protocol vault flexible yield pool so it funds others
            let penalty_balance = balance::split(&mut locker.principal, penalty_deducted);
            balance::join(&mut vault.total_flexible_balance, penalty_balance);

            let main_balance = balance::split(&mut locker.principal, net_payout);
            balance::join(&mut final_balance, main_balance);
        } else {
            // Safe maturity path: Compute compound balance additions
            // Yield = principal * APY_bps * duration_days / (10000 * 365)
            let duration_days = locker.duration_ms / 86400000;
            let safe_days = if (duration_days == 0) { 1 } else { duration_days };
            interest_earned = (principal_val * locker.apy_bps * safe_days) / (10000 * 365);

            // Merge locked principal
            let principal_balance = balance::split(&mut locker.principal, principal_val);
            balance::join(&mut final_balance, principal_balance);

            // Generate interest. Real interest payouts would be provisioned dynamically.
            // For Sandbox, create custom system balance adjustments.
            if (balance::value(&vault.total_flexible_balance) >= interest_earned) {
                let interest_balance = balance::split(&mut vault.total_flexible_balance, interest_earned);
                balance::join(&mut final_balance, interest_balance);
            }
        };

        // Complete payouts
        let locker_id = object::id(&locker);
        let payout_coin = coin::from_balance(final_balance, ctx);
        transfer::public_transfer(payout_coin, sender);

        // Terminate and dismantle locker SUI resource bounds secure
        locker.is_active = false;
        let FixedLocker { id, owner: _, principal, start_timestamp_ms: _, duration_ms: _, apy_bps: _, is_active: _ } = locker;
        object::delete(id);
        balance::destroy_zero(principal);

        event::emit(LockerClaimedEvent {
            locker_id,
            recipient: sender,
            principal_returned: principal_val,
            interest_earned,
            is_early_termination,
            penalty_deducted,
        });
    }

    // --- Public Entry: Target Savings Goals ---

    /// Create an owned target savings goal object
    public entry fun create_savings_goal(
        title: vector<u8>,
        target_amount_sui: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let uid = object::new(ctx);
        let goal_id = object::uid_to_inner(&uid);

        let goal = SavingsGoal {
            id: uid,
            title,
            target_amount_sui,
            balance: balance::zero(),
            is_completed: false,
        };

        transfer::public_transfer(goal, sender);

        event::emit(GoalCreatedEvent {
            goal_id,
            title,
            target_amount: target_amount_sui,
        });
    }

    /// Fund SUI directly into a Target savings goal object
    public entry fun fund_savings_goal(
        goal: &mut SavingsGoal,
        fund_coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&fund_coin);
        assert!(amount > 0, EInsufficientFunds);
        assert!(!goal.is_completed, EGoalAlreadyCompleted);

        let coin_balance = coin::into_balance(fund_coin);
        balance::join(&mut goal.balance, coin_balance);

        let current_accumulated = balance::value(&goal.balance);
        if (current_accumulated >= goal.target_amount_sui) {
            goal.is_completed = true;
        };

        event::emit(GoalFundedEvent {
            goal_id: object::id(goal),
            amount,
            is_now_complete: goal.is_completed,
        });
    }

    /// Claim and release funds accumulated inside a target goal
    public entry fun liquidate_savings_goal(
        goal: SavingsGoal,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let total_val = balance::value(&goal.balance);
        assert!(total_val > 0, EInsufficientFunds);

        let SavingsGoal { id, title: _, target_amount_sui: _, balance, is_completed: _ } = goal;
        let payout_coin = coin::from_balance(balance, ctx);
        transfer::public_transfer(payout_coin, sender);

        object::delete(id);
    }

    // --- Admin Control Functions ---

    /// Change the variable interest APY rate of the flexible oWealth pool
    public entry fun update_flexible_apy(
        _admin: &AdminCap,
        vault: &mut SharedProtocolVault,
        new_apy_bps: u64
    ) {
        assert!(new_apy_bps > 0 && new_apy_bps <= 10000, EInvalidParameter);
        vault.base_flexible_apy_bps = new_apy_bps;
    }
}
