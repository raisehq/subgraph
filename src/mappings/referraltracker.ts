import {
    ReferralRegistered as ReferralRegisteredEvent,
    ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent 
} from "../../generated/ReferralTracker/ReferralTracker"
import { User, Referral } from "../../generated/schema"

export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    if (user.referrals == null) {
        user.referrals = [];
    }

    let referralId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let referral = new Referral(referralId);
    referral.referree = event.params.user.toHex();
    referral.referrer = event.params.referrer.toHex();
    referral.save()

    let referrals = user.referrals;
    referrals.push(referral.id);
    user.referrals = referrals;

    if (user.referralBountyCount == null) {
        user.referralBountyCount = 0;
    }

    user.referralBountyCount = user.referralBountyCount + 1;

    user.save();
}

export function handleReferralBonusWithdrawn(event: ReferralBonusWithdrawnEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    user.referralBountyCount = user.referralBountyCount - 1;

    user.save();
}