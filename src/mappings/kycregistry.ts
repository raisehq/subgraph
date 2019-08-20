import {
    RemovedFromKYC as RemovedFromKYCEvent,
    AddedToKYC as AddedToKYCEvent
} from "../../generated/KYCRegistry/KYCRegistry"
import { User } from "../../generated/schema"
import { log, BigInt } from '@graphprotocol/graph-ts'

export function handleRemovedFromKYC(event: RemovedFromKYCEvent): void {
    let userAddress = event.params.user;
    let user = new User(userAddress.toHex());
    
    user.kyced = false;

    user.save();
}

export function handleAddedToKYC(event: AddedToKYCEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.referrals = [];
        user.deposited = false;
        user.totalBountyWithdrawn = BigInt.fromI32(0);
        user.totalBountyToWithdraw = BigInt.fromI32(0);
        user.totalReferralsCount = 0;
        user.loanFundings = [];
        user.loanRequests = [];
    }

    user.kyced = true;

    user.save();
}
