import {
    UserDepositCompleted as UserDepositCompletedEvent,
    UserWithdrawnCompleted as UserWithdrawnCompletedEvent
} from "../../generated/DepositRegistry/DepositRegistry"
import { User } from "../../generated/schema"
import { log, BigInt } from '@graphprotocol/graph-ts'


export function handleUserDepositCompleted(event: UserDepositCompletedEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.referrals = [];
        user.kyced = false;
        user.totalBountyWithdrawn = BigInt.fromI32(0);
        user.totalBountyToWithdraw = BigInt.fromI32(0);
        user.totalReferralsCount = 0;
    }

    user.deposited = true;
    
    user.save();
}

export function handleUserWithdrawnCompleted(event: UserWithdrawnCompletedEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.referrals = [];
        user.kyced = false;
        user.totalBountyWithdrawn = BigInt.fromI32(0);
        user.totalBountyToWithdraw = BigInt.fromI32(0);
        user.totalReferralsCount = 0;
    }

    user.deposited = false;
    
    user.save();
}