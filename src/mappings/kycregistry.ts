import {
    RemoveFromKYC as RemoveFromKYCEvent,
    AddToKYC as AddToKYCEvent
} from "../../generated/KYCRegistry/KYCRegistry"
import { User } from "../../generated/schema"

export function handleRemoveFromKYC(event: RemoveFromKYCEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.requests = [];
        user.fundings = [];
        user.referrals = [];
        user.referralBountyCount = 0;
        user.deposited = false;
    }

    user.kyced = false;
    
    user.save();
}

export function handleAddToKYC(event: AddToKYCEvent): void {
    let userAddress = event.params.user;
    let user = User.load(userAddress.toHex())
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.requests = [];
        user.fundings = [];
        user.referrals = [];
        user.referralBountyCount = 0;
        user.deposited = false;
    }

    user.kyced = true;
    
    user.save();
}
