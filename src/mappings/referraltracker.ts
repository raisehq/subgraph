import {
    ReferralRegistered as ReferralRegisteredEvent,
    ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent 
} from "../../generated/ReferralTracker/ReferralTracker"
// import { ReferralTracker } from '../../generated/ReferralTracker/ReferralTracker';
import { User, Referral } from "../../generated/schema"
import { log } from '@graphprotocol/graph-ts'

export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
    log.log(4, '=================handle referral registered=====================');
    // let userAddress = event.params.referrer;
    // let user = User.load(userAddress.toHex());

    // if (user.referrals == null) {
    //     user.referrals = [];
    // }

    // let referralId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    // let referral = new Referral(referralId);
    
    // let referralContract = ReferralTracker.bind(event.params.referralAddress);
    // let referralBonus = referralContract.REFERRAL_BONUS();
    // let unclaimedReferrals = referralContract.unclaimedReferrals(event.params.referrer);

    // referral.referree = event.params.user.toHex();
    // referral.referrer = event.params.referrer.toHex();
    // referral.save()

    // let referrals = user.referrals;
    // referrals.push(referral.id);
    // user.referrals = referrals;
    
    // user.totalBountyToWithdraw = referralBonus.toI32() * unclaimedReferrals.toI32();;
    // user.totalReferralsCount = user.totalReferralsCount + 1;

    // user.save();
}

export function handleReferralBonusWithdrawn(event: ReferralBonusWithdrawnEvent): void {
    // let userAddress = event.params.referrer;
    // let user = User.load(userAddress.toHex());

    // // let amountWithdrawn = event.params.amount.toI32();

    // // user.totalBountyWithdrawn = user.totalBountyWithdrawn + amountWithdrawn;
    // // user.totalBountyToWithdraw = user.totalBountyToWithdraw - amountWithdrawn;

    // user.save();
}