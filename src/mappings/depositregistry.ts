import {
    UserDepositCompleted as UserDepositCompletedEvent,
    UserWithdrawnCompleted as UserWithdrawnCompletedEvent
} from "../../generated/DepositRegistry/DepositRegistry"
import { User } from "../../generated/schema"


export function handleUserDepositCompleted(event: UserDepositCompletedEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.requests = [];
        user.fundings = [];
        user.referrals = [];
        user.referralBountyCount = 0;
        user.kyced = false;
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
        user.requests = [];
        user.fundings = [];
        user.referrals = [];
        user.referralBountyCount = 0;
        user.kyced = false;
    }

    user.deposited = false;
    
    user.save();
}