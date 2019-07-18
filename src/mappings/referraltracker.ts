import {
    ReferralRegistered as ReferralRegisteredEvent,
    ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent 
} from "../../generated/ReferralTracker/ReferralTracker"
import { ReferralTracker } from '../../generated/ReferralTracker/ReferralTracker';
import { User, Referral } from "../../generated/schema"

export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    let referralId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let referral = new Referral(referralId);

    let referralContract = ReferralTracker.bind(event.params.referralAddress);
    let referralBonus = referralContract.REFERRAL_BONUS();
    let unclaimedReferrals = referralContract.unclaimedReferrals(event.params.referrer);

    referral.referred = event.params.user.toHex();
    referral.referrer = user.id;

    referral.save()
    let referrals = user.referrals;
    let referralIndex = referrals.indexOf(referralId);

    if (referralIndex == -1 && referral.referred != null) {
        referrals.push(referralId);
        user.referrals = referrals;

        user.totalBountyToWithdraw = unclaimedReferrals.times(referralBonus);
        user.totalReferralsCount = user.totalReferralsCount + 1;

        user.save();
    }
}

export function handleReferralBonusWithdrawn(event: ReferralBonusWithdrawnEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    let amountWithdrawn = event.params.amount;
    user.totalBountyWithdrawn = user.totalBountyWithdrawn.plus(amountWithdrawn);
    user.totalBountyToWithdraw = user.totalBountyToWithdraw.minus(amountWithdrawn);
    user.save();
}