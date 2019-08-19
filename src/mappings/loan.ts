import {
    LoanContract,
    LoanCreated as LoanCreatedEvent,
    MinimumFundingReached as MinimumFundingReachedEvent,
    FullyFunded as FullyFundedEvent,
    Funded as FundedEvent,
    FailedToFund as FailedToFundEvent,
    LoanRepaid as LoanRepaidEvent,
    RepaymentWithdrawn as RepaymentWithdrawnEvent,
    RefundWithdrawn as RefundWithdrawnEvent,
    FullyRefunded as FullyRefundedEvent,
    LoanFundsWithdrawn as LoanFundsWithdrawn,
    LoanDefaulted as LoanDefaultedEvent,
    OperatorWithdrawn as OperatorWithdrawnEvent,
    AuctionSuccessful as AuctionSuccessfulEvent,
} from "../../generated/LoanContractDispatcher/templates/LoanContract/LoanContract"
import { Loan, User, Funding } from "../../generated/schema"
import { log } from '@graphprotocol/graph-ts';

// TODO: why does not get this events
export function handleLoanCreated(event: LoanCreatedEvent): void {
    log.log(4, `******************* ENTER HANDLE LOAN CREATED **************** `);
}

//****************************
//TODO: double check race condition of events what happens??????????????
//*****************
export function handleMinimumFundingReached(event: MinimumFundingReachedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex();
    let loan = new Loan(loanAddressHex);
    
    let loanContract = LoanContract.bind(event.params.loanAddress);
    let loanState = loanContract.currentState();
    let minimumReached = loanContract.minimumReached();

    if (loanState == 2) {
        let auctionLastFundedBlock = loanContract.lastFundedBlock();
        let borrowerDebt = loanContract.borrowerDebt();
        let auctionEnded = loanContract.auctionEnded();
    
        loan.auctionEnded = auctionEnded;
        loan.auctionLastFundedBlock = auctionLastFundedBlock;
        loan.lastFundedDate = new Date().toString();
        loan.borrowerDebt = borrowerDebt;
        loan.interestRate = event.params.interest;
    }

    loan.auctionBalance = event.params.currentBalance;
    loan.state = loanState;
    loan.minimumReached = minimumReached;

    loan.save()
}

export function handleFullyFunded(event: FullyFundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress)
    let loanState = loanContract.currentState()

    loan.auctionEnded = true;
    loan.auctionLastFundedBlock = event.params.fundedBlock;
    loan.lastFundedDate = new Date().toString();
    loan.borrowerDebt = event.params.balanceToRepay;
    loan.interestRate = event.params.interest;

    loan.auctionBalance = event.params.auctionBalance;
    loan.auctionFullyFunded = true;
    loan.state = loanState

    loan.save()
}

export function handleFunded(event: FundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex();
    let loan = new Loan(loanAddressHex);
    
    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();
    let auctionBalance = loanContract.auctionBalance();
    let borrowerDebt = loanContract.borrowerDebt();
    let auctionEnded = loanContract.auctionEnded();

    loan.auctionEnded = auctionEnded;
    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = event.params.interest;

    loan.lastFundedBlock = event.params.fundedBlock;
    loan.lastFundedDate = new Date().toString();

    loan.auctionBalance = auctionBalance;
    loan.state = loanState

    loan.save()

    // Update User
    let userAddress = event.params.lender;
    let user = User.load(userAddress.toHex())

    // creating funding transaction
    let funding = new Funding(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
    funding.loan = loanAddressHex;
    funding.amount = event.params.amount;
    funding.withdrawn = false;
    funding.successful = true;

    funding.save();

    let fundings = user.loanFundings;
    fundings.push(funding.id);
    user.loanFundings = fundings;

    user.save()
}

export function handleFailedToFund(event: FailedToFundEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress)

    let loanState = loanContract.currentState()
    let auctionBalance = loanContract.auctionBalance();
    let borrowerDebt = loanContract.borrowerDebt();
    let interestRate = loanContract.getInterestRate();

    loan.borrowerDebt = borrowerDebt;
    loan.interestRate = interestRate;
    
    loan.auctionBalance = auctionBalance;
    loan.state = loanState

    if (loanState == 1) {
        loan.auctionEnded = true;
        loan.auctionFailed = true;
    }

    loan.save()

    // creating funding transaction
    let userAddress = event.params.lender;
    let user = User.load(userAddress.toHex())

    let funding = new Funding(
        event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );

    funding.loan = loanAddressHex;
    funding.amount = event.params.amount;
    funding.withdrawn = false;
    funding.successful = false;
    
    funding.save();

    let fundings = user.loanFundings;
    fundings.push(funding.id);
    user.loanFundings = fundings;

    user.save();
}

export function handleAuctionSuccessful(event: AuctionSuccessfulEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    loan.auctionEnded = true;
    loan.auctionBalance = event.params.auctionBalance;
    loan.borrowerDebt = event.params.balanceToRepay;
    loan.operatorBalance = event.params.operatorBalance;
    loan.interestRate = event.params.interest;
    loan.lastFundedBlock = event.params.fundedBlock;

    let loanContract = LoanContract.bind(event.params.loanAddress)

}


export function handleLoanRepaid(event: LoanRepaidEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.loanRepaid = true;
    loan.loanRepaidTimestamp = event.params.timestampRepaid;
    loan.save(); 
}

export function handleRepaymentWithdrawn(event: RepaymentWithdrawnEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save(); 
}

export function handleRefundWithdrawn(event: RefundWithdrawnEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save(); 
}

export function handleFullyRefunded(event: FullyRefundedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save();
}

export function handleLoanFundsWithdrawn(event: LoanFundsWithdrawn): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.loanWithdrawn = true;
    loan.save();
}

export function handleLoanDefaulted(event: LoanDefaultedEvent): void {
    let loanAddressHex = event.params.loanAddress.toHex()
    let loan = new Loan(loanAddressHex);

    let loanContract = LoanContract.bind(event.params.loanAddress);

    let loanState = loanContract.currentState();

    loan.state = loanState;
    loan.save();
}

export function handleOperatorWithdrawn(event: OperatorWithdrawnEvent): void {

}