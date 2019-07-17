import {
    ReferralRegistered as ReferralRegisteredEvent,
    ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent 
} from "../../generated/ReferralTracker/ReferralTracker"
import { ReferralTracker } from '../../generated/ReferralTracker/ReferralTracker';
import { User, Referral } from "../../generated/schema"
import { log, BigInt } from '@graphprotocol/graph-ts'

export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());
    if (user == null) {
        user = new User(userAddress.toHex());
        user.address = userAddress;
        user.referrals = [];
        user.kyced = false;
        user.deposited = false;
        user.totalBountyWithdrawn = 0;
        user.totalBountyToWithdraw = 0;
        user.totalReferralsCount = 0;
    }

    let referralId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

    let referral = new Referral(referralId);

    let referralContract = ReferralTracker.bind(event.params.referralAddress);
    // TODO: find how to transform REFERRAL_BONUS to i32
    // let referralBonus = referralContract.REFERRAL_BONUS();
    // log.log(4, 'referral bonus is =====> ' + referralBonus.toString());
    let unclaimedReferrals = referralContract.unclaimedReferrals(event.params.referrer);
    log.log(4, 'unclaimed referrals =====> ' + unclaimedReferrals.toString());

    referral.referred = event.params.user.toHex();
    referral.referrer = user.id;

    referral.save()
    let referrals = user.referrals;
    let referralIndex = referrals.indexOf(referralId);

    if (referralIndex == -1 && referral.referred != null) {
        referrals.push(referralId);
        user.referrals = referrals;
        
        user.totalBountyToWithdraw = 100 * unclaimedReferrals.toI32();
        log.log(4, '||||||||====> totalBounty =====> ' + unclaimedReferrals.toString());
        user.totalReferralsCount = user.totalReferralsCount + 1;
        
        user.save();
    }
}

export function handleReferralBonusWithdrawn(event: ReferralBonusWithdrawnEvent): void {
    log.log(4, '=================handle referral withdrawn=====================');
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    let amountWithdrawn = event.params.amount.toI32();

    user.totalBountyWithdrawn = user.totalBountyWithdrawn + amountWithdrawn;
    user.totalBountyToWithdraw = user.totalBountyToWithdraw - amountWithdrawn;

    user.save();
}