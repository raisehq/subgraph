import {
    ReferralRegistered as ReferralRegisteredEvent,
    ReferralBonusWithdrawn as ReferralBonusWithdrawnEvent,
    FundsAdded as FundsAddedEvent,
    Paused as PausedEvent,
    Unpaused as UnpausedEvent,
    FundsRemoved as FundsRemovedEvent
} from "../../generated/ReferralTracker/ReferralTracker"
import { ReferralTracker as ReferralTrackerContract } from '../../generated/ReferralTracker/ReferralTracker';
import { User, Referral, ReferralTracker } from "../../generated/schema"
import { BigInt, log } from '@graphprotocol/graph-ts';


export function handleReferralRegistered(event: ReferralRegisteredEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    // Generate referral
    let referralId = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
    let referral = new Referral(referralId);

    let referralContract = ReferralTrackerContract.bind(event.params.referralAddress);
    let referralBonus = referralContract.REFERRAL_BONUS();
    let unclaimedReferrals = referralContract.unclaimedReferrals(event.params.referrer);

    referral.referred = event.params.user.toHex();
    referral.referrer = user.id;

    referral.save();

    // Add referral to user
    let referrals = user.referrals;
    let referralIndex = referrals.indexOf(referralId);

    if (referralIndex == -1 && referral.referred != null) {
        referrals.push(referralId);
        user.referrals = referrals;

        user.totalBountyToWithdraw = unclaimedReferrals.times(referralBonus);
        user.totalReferralsCount = user.totalReferralsCount + 1;

        user.save();
    }

    // init tracker
    let trackerAddress = event.address;
    let tracker = ReferralTracker.load(trackerAddress.toHex());
    if (tracker == null) {
        new ReferralTracker(trackerAddress.toHex());
        tracker.referrals = [];
        tracker.referrralsCount = 0;
        tracker.totalFundsWithdrawn = BigInt.fromI32(0);
        tracker.currentFunds = BigInt.fromI32(0);
        tracker.paused = false;
        
    }
    // Add referral to user
    referrals = tracker.referrals;
    referralIndex = referrals.indexOf(referralId);

    if (referralIndex == -1 && referral.referred != null) {
        referrals.push(referralId);
        tracker.referrals = referrals;
        tracker.referralsCount = tracker.referralsCount + 1;
        // tracker.currentFunds = get from herobalance

        tracker.save();
    }
    
}

export function handleReferralBonusWithdrawn(event: ReferralBonusWithdrawnEvent): void {
    let userAddress = event.params.referrer;
    let user = User.load(userAddress.toHex());

    let amountWithdrawn = event.params.amount;
    user.totalBountyWithdrawn = user.totalBountyWithdrawn.plus(amountWithdrawn);
    user.totalBountyToWithdraw = user.totalBountyToWithdraw.minus(amountWithdrawn);
    user.save();

    let trackerAddress = event.address;
    let tracker = new ReferralTracker(trackerAddress.toHex());

    tracker.totalFundsWithdrawn = tracker.totalFundsWithdrawn.plus(amountWithdrawn);

    //get funds from heroToken???
    // tracker.currentFunds
}

export function handleFundsAdded(event: FundsAddedEvent): void {
    let trackerAddress = event.address;
    let tracker = ReferralTracker.load(trackerAddress.toHex());
    if (tracker == null) {
        new ReferralTracker(trackerAddress.toHex());
        tracker.referrals = [];
        tracker.referrralsCount = 0;
        tracker.totalFundsWithdrawn = BigInt.fromI32(0);
        tracker.currentFunds = BigInt.fromI32(0);
        tracker.paused = false;
        
    }
    
    //get funds from heroToken???

    tracker.save();
}

export function handleFundsRemoved(event: FundsRemovedEvent): void {
    let trackerAddress = event.address;
    let tracker = new ReferralTracker(trackerAddress.toHex());

    //get funds from heroToken???

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