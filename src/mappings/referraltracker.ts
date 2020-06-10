import {
  ReferralRegistered as ReferralRegisteredEvent,
  ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent,
  FundsAdded as FundsAddedEvent,
  Paused as PausedEvent,
  Unpaused as UnpausedEvent,
  FundsRemoved as FundsRemovedEvent,
  //
  UpdateToken as UpdateTokenEvent,
  AddRegistryAddress as AddRegistryAddressEvent,
  RemoveRegistryAddress as RemoveRegistryAddressEvent,
  UpdateReferralBonus as UpdateReferralBonusEvent,
  ReferralTrackerCreated as ReferralTrackerCreatedEvent,
  AuthAddressUpdated as AuthAddressUpdatedEvent,
} from "../../generated/ReferralTracker/ReferralTracker";
import { ReferralTracker as ReferralTrackerContract } from "../../generated/ReferralTracker/ReferralTracker";
import { User, Referral, ReferralTracker } from "../../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

export function handleReferralTrackerCreated(
  event: ReferralTrackerCreatedEvent
): void {
  let referralTrackerAddress = event.params.referralAddress;

  // init tracker
  let tracker = ReferralTracker.load(referralTrackerAddress.toHex());
  if (tracker == null) {
    tracker = new ReferralTracker(referralTrackerAddress.toHex());
    tracker.address = referralTrackerAddress;
    tracker.referrals = [];
    tracker.referralsCount = 0;
    tracker.totalFundsWithdrawn = BigInt.fromI32(0);
    tracker.referralsPendingToWithdraw = 0;
    tracker.referralsWithdrawn = 0;
    tracker.currentFunds = BigInt.fromI32(0);
    tracker.paused = false;
    tracker.authAddress = event.params.auth;
    tracker.referredAddresses = [];
    tracker.registryAddresses = [];
    tracker.bonus = event.params.referralBonus;
    tracker.bonusTokenAddress = event.params.tokenAddress;

    let registryAddresses = tracker.registryAddresses;
    registryAddresses.push(event.params.registryAddress);
    tracker.registryAddresses = registryAddresses;
  }
  tracker.save();
}

export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
  let userAddress = event.params.referrer;
  let user = User.load(userAddress.toHex());

  // Generate referral
  let referralId =
    event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  let referral = new Referral(referralId);

  let referralContract = ReferralTrackerContract.bind(
    event.params.referralAddress
  );

  let unclaimedAmount = referralContract.getUnclaimedAmount(
    event.params.referrer
  );
  let currentBalance = referralContract.getTrackerBalance();

  referral.referred = event.params.user.toHex();
  referral.referrer = user.id;
  referral.bonus = event.params.referralAmount;

  referral.save();

  // Add referral to user
  let referrals = user.referrals;
  let referralIndex = referrals.indexOf(referralId);

  if (referralIndex == -1 && referral.referred != null) {
    referrals.push(referralId);
    user.referrals = referrals;

    user.totalBountyToWithdraw = unclaimedAmount;
    user.totalReferralsCount = user.totalReferralsCount + 1;

    user.save();
  }

  // init tracker
  let trackerAddress = event.address;
  let tracker = ReferralTracker.load(trackerAddress.toHex());

  // Add referral to user
  referrals = tracker.referrals;
  referralIndex = referrals.indexOf(referralId);

  if (referralIndex == -1 && referral.referred != null) {
    referrals.push(referralId);
    tracker.referrals = referrals;
    tracker.referralsCount = tracker.referralsCount + 1;
    tracker.referralsPendingToWithdraw = tracker.referralsPendingToWithdraw + 1;
    tracker.currentFunds = currentBalance;

    tracker.save();
  }
}

export function handleReferralBonusWithdrawn(
  event: ReferralBonusWithdrawnEvent
): void {
  let userAddress = event.params.referrer;
  let user = User.load(userAddress.toHex());

  let amountWithdrawn = event.params.amount;
  user.totalBountyWithdrawn = user.totalBountyWithdrawn.plus(amountWithdrawn);
  user.totalBountyToWithdraw = user.totalBountyToWithdraw.minus(
    amountWithdrawn
  );
  user.save();

  let trackerAddress = event.params.referralAddress;
  let tracker = ReferralTracker.load(trackerAddress.toHex());

  let currentBalance = event.params.currentTrackerBalance;
  tracker.referralsPendingToWithdraw = tracker.referralsPendingToWithdraw - 1;
  tracker.referralsWithdrawn = tracker.referralsWithdrawn + 1;

  tracker.totalFundsWithdrawn = tracker.totalFundsWithdrawn.plus(
    amountWithdrawn
  );

  tracker.currentFunds = currentBalance;

  tracker.save();
}

export function handleFundsAdded(event: FundsAddedEvent): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = ReferralTracker.load(trackerAddress.toHex());

  let referralContract = ReferralTrackerContract.bind(trackerAddress);
  let currentBalance = referralContract.getTrackerBalance();

  tracker.currentFunds = currentBalance;

  tracker.save();
}

export function handleFundsRemoved(event: FundsRemovedEvent): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  let referralContract = ReferralTrackerContract.bind(trackerAddress);
  let currentBalance = referralContract.getTrackerBalance();

  tracker.currentFunds = currentBalance;
  tracker.save();
}

export function handlePaused(event: PausedEvent): void {
  let trackerAddress = event.address;
  let tracker = new ReferralTracker(trackerAddress.toHex());
  tracker.paused = true;
  tracker.save();
}

export function handleUnpaused(event: UnpausedEvent): void {
  let trackerAddress = event.address;
  let tracker = new ReferralTracker(trackerAddress.toHex());
  tracker.paused = false;
  tracker.save();
}

export function handleAuthAddressUpdated(event: AuthAddressUpdatedEvent): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  tracker.authAddress = event.params.authAddress;

  tracker.save();
}

export function handleUpdateReferralBonus(
  event: UpdateReferralBonusEvent
): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  tracker.bonus = event.params.bonus;

  tracker.save();
}

export function handleUpdateToken(event: UpdateTokenEvent): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  tracker.bonus = event.params.bonus;
  tracker.bonusTokenAddress = event.params.newToken;

  tracker.save();
}

export function handleRemoveRegistryAddress(
  event: RemoveRegistryAddressEvent
): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  let registryAddresses = tracker.registryAddresses;
  let registryIndex = registryAddresses.indexOf(event.params.addressToRemove);
  if (registryIndex > -1) {
    registryAddresses.splice(registryIndex, 1);
    tracker.registryAddresses = registryAddresses;

    tracker.save();
  }
}

export function handleAddRegistryAddress(event: AddRegistryAddressEvent): void {
  let trackerAddress = event.params.referralAddress;
  let tracker = new ReferralTracker(trackerAddress.toHex());

  let registryAddresses = tracker.registryAddresses;
  let registryIndex = registryAddresses.indexOf(
    event.params.newRegistryAddress
  );
  if (registryIndex == -1) {
    registryAddresses.push(event.params.newRegistryAddress);
    tracker.registryAddresses = registryAddresses;

    tracker.save();
  }
}
