import {
  UserDepositCompleted as UserDepositCompletedEvent,
  UserWithdrawnCompleted as UserWithdrawnCompletedEvent,
  AddressUnlockedForWithdrawal as AddressUnlockedForWithdrawalEvent,
} from "../../generated/DepositRegistry/DepositRegistry";
import { User } from "../../generated/schema";
import { log, BigInt } from "@graphprotocol/graph-ts";

export function handleUserDepositCompleted(
  event: UserDepositCompletedEvent
): void {
  let userAddress = event.params.user;
  let user = User.load(userAddress.toHex());
  if (user == null) {
    user = new User(userAddress.toHex());
    user.address = userAddress;
    user.referrals = [];
    user.kyced = false;
    user.totalBountyWithdrawn = BigInt.fromI32(0);
    user.totalBountyToWithdraw = BigInt.fromI32(0);
    user.totalReferralsCount = 0;
    user.withdrawalUnlocked = false;
    user.loanFundings = [];
    user.loanRequests = [];
    user.createdBlockNumber = event.block.number;
    user.createdTimestamp = event.block.timestamp;
    user.investmentsCount = 0;
  }

  user.depositBlockNumber = event.block.number;
  user.depositTimestamp = event.block.timestamp;
  user.deposited = true;

  user.save();
}

export function handleUserWithdrawnCompleted(
  event: UserWithdrawnCompletedEvent
): void {
  let userAddress = event.params.user;
  let user = new User(userAddress.toHex());
  user.withdrawalUnlocked = false;
  user.deposited = false;

  user.save();
}

export function handleAddressUnlockedForWithdrawal(
  event: AddressUnlockedForWithdrawalEvent
): void {
  let userAddress = event.params.user;
  let user = new User(userAddress.toHex());
  user.withdrawalUnlocked = true;

  user.save();
}
